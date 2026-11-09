<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Usuario del panel privado. Los permisos se obtienen de sus roles (RBAC) y el alcance
 * sobre datos de dependencias se limita a las dependencias asignadas.
 */
class User extends Authenticatable
{
    use Notifiable, TracksChanges;

    protected $guarded = ['id', 'password', 'mfa_secret', 'mfa_enabled', 'remember_token'];

    protected $hidden = ['password', 'remember_token', 'mfa_secret'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'password' => 'hashed',
            'mfa_secret' => 'encrypted',
            'mfa_enabled' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    private ?array $permissionCache = null;

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function dependencies()
    {
        return $this->belongsToMany(Dependency::class);
    }

    /** Lista de códigos de permiso efectivos (unión de los permisos de sus roles). */
    public function permissionCodes(): array
    {
        if ($this->permissionCache === null) {
            $this->permissionCache = Permission::query()
                ->whereHas('roles.users', fn ($q) => $q->where('users.id', $this->id))
                ->pluck('code')->all();
        }

        return $this->permissionCache;
    }

    public function hasPermission(string $code): bool
    {
        return $this->is_active && in_array($code, $this->permissionCodes(), true);
    }

    public function flushPermissionCache(): void
    {
        $this->permissionCache = null;
    }

    public function dependencyIds(): array
    {
        return $this->dependencies()->pluck('dependencies.id')->all();
    }

    /** ¿El registro (por su dependencia) está dentro del alcance del usuario? */
    public function inScope(?int $dependencyId): bool
    {
        if ($this->hasPermission('scope.all_dependencies')) {
            return true;
        }

        return $dependencyId !== null && in_array($dependencyId, $this->dependencyIds(), true);
    }

    public function sendPasswordResetNotification($token): void
    {
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('app.admin_url'), '/').'/restablecer?token='.$token.'&email='.urlencode($user->email));
        $this->notify(new ResetPassword($token));
    }
}
