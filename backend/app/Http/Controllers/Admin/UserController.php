<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Administración de usuarios, roles y permisos.
 * Un administrador no puede modificar sus propios roles ni desactivarse (evita escalamiento de privilegios).
 */
class UserController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->hasPermission('users.view') || $request->user()->hasPermission('users.manage'), 403);
        $q = User::with('roles:id,code,name', 'dependencies:id,code')->orderBy('name');
        if ($t = $request->query('q')) {
            $q->where(fn ($w) => $w->where('name', 'like', "%$t%")->orWhere('email', 'like', "%$t%"));
        }

        return $q->paginate(min((int) $request->query('per_page', 25), 200));
    }

    public function show(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('users.view') || $request->user()->hasPermission('users.manage'), 403);

        return User::with('roles:id,code,name', 'dependencies:id,code,name')->findOrFail($id);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->hasPermission('users.manage'), 403);
        $data = $request->validate($this->rules(null));
        $user = new User(collect($data)->only(['name', 'email', 'is_active'])->all());
        $user->password = $data['password'];
        $user->password_changed_at = now();
        $user->save();
        $this->syncRelations($request, $user, $data);
        Audit::log('user.created', $user, ['roles' => $data['role_ids'] ?? []]);

        return response()->json($this->show($request, $user->id), 201);
    }

    public function update(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('users.manage'), 403);
        $user = User::findOrFail($id);
        $data = $request->validate($this->rules($user));
        if ($user->id === $request->user()->id) {
            abort_if(isset($data['role_ids']) && array_map('intval', $data['role_ids']) != $user->roles()->pluck('roles.id')->all(), 403, 'No puede modificar sus propios roles.');
            abort_if(array_key_exists('is_active', $data) && ! $data['is_active'], 403, 'No puede desactivar su propia cuenta.');
        }
        $user->fill(collect($data)->only(['name', 'email', 'is_active'])->all());
        if (! empty($data['password'])) {
            $user->password = $data['password'];
            $user->password_changed_at = now();
        }
        $user->save();
        $this->syncRelations($request, $user, $data);
        if ($request->boolean('reset_mfa')) {
            $user->forceFill(['mfa_secret' => null, 'mfa_enabled' => false])->save();
            Audit::log('user.mfa_reset', $user);
        }

        return $this->show($request, $user->id);
    }

    public function destroy(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('users.manage'), 403);
        abort_if($id === $request->user()->id, 403, 'No puede eliminar su propia cuenta.');
        $user = User::findOrFail($id);
        // Se desactiva en lugar de borrar para conservar la trazabilidad de sus registros.
        $user->update(['is_active' => false]);
        Audit::log('user.deactivated', $user);

        return response()->noContent();
    }

    private function rules(?User $user): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'string', AuthController::passwordRule()],
            'is_active' => 'boolean',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'dependency_ids' => 'array',
            'dependency_ids.*' => 'exists:dependencies,id',
        ];
    }

    private function syncRelations(Request $request, User $user, array $data): void
    {
        if (array_key_exists('role_ids', $data)) {
            $before = $user->roles()->pluck('roles.id')->all();
            $user->roles()->sync($data['role_ids']);
            if ($before != $data['role_ids']) {
                Audit::log('user.roles_changed', $user, ['before' => $before, 'after' => $data['role_ids']]);
            }
        }
        if (array_key_exists('dependency_ids', $data)) {
            $user->dependencies()->sync($data['dependency_ids']);
        }
    }

    // ---- Roles y permisos ----

    public function roles(Request $request)
    {
        abort_unless($request->user()->hasPermission('users.view') || $request->user()->hasPermission('roles.manage') || $request->user()->hasPermission('users.manage'), 403);

        return Role::with('permissions:id,code')->withCount('users')->orderBy('name')->get();
    }

    public function permissions(Request $request)
    {
        abort_unless($request->user()->hasPermission('roles.manage') || $request->user()->hasPermission('users.view'), 403);

        return Permission::orderBy('group')->orderBy('code')->get();
    }

    public function saveRole(Request $request, ?int $id = null)
    {
        abort_unless($request->user()->hasPermission('roles.manage'), 403);
        $role = $id ? Role::findOrFail($id) : new Role;
        $data = $request->validate([
            'code' => ['required', 'alpha_dash', 'max:60', Rule::unique('roles', 'code')->ignore($role->id)],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);
        if ($role->exists) {
            abort_if($request->user()->roles()->whereKey($role->id)->exists(), 403, 'No puede modificar un rol que usted mismo tiene asignado.');
        }
        $role->fill(collect($data)->only(['code', 'name', 'description'])->all())->save();
        $before = $role->permissions()->pluck('permissions.id')->all();
        $role->permissions()->sync($data['permission_ids'] ?? []);
        Audit::log('role.permissions_changed', $role, ['before' => $before, 'after' => $data['permission_ids'] ?? []]);

        return $role->load('permissions:id,code');
    }

    public function deleteRole(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('roles.manage'), 403);
        $role = Role::withCount('users')->findOrFail($id);
        abort_if($role->users_count > 0, 422, 'El rol tiene usuarios asignados.');
        $role->delete();
        Audit::log('role.deleted', $role);

        return response()->noContent();
    }
}
