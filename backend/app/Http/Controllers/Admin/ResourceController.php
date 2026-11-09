<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\ContentWorkflow;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * CRUD genérico del panel. Cada recurso define su modelo, permisos, reglas de validación y relaciones.
 * Toda la autorización se verifica aquí (servidor), independientemente de lo que muestre la interfaz.
 */
abstract class ResourceController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    protected array $with = [];

    protected string $viewPermission;

    protected string $editPermission;

    /** Permiso para publicar/aprobar (si el recurso tiene flujo editorial). */
    protected ?string $publishPermission = null;

    /** Campo de estado editorial (status | publication_status) o null. */
    protected ?string $workflowField = null;

    protected bool $workflowRequiresReview = false;

    protected array $searchable = ['name'];

    protected array $filterable = [];

    protected string $orderBy = 'id';

    protected string $orderDir = 'desc';

    /** Si el modelo tiene dependency_id, se restringe al alcance del usuario. */
    protected bool $scoped = false;

    /** Campo a partir del cual se genera el slug (si el modelo tiene slug). */
    protected ?string $slugFrom = null;

    abstract protected function rules(Request $request, ?Model $item): array;

    protected function query(Request $request): Builder
    {
        $q = ($this->model)::query()->with($this->with);
        if ($this->scoped && ! $request->user()->hasPermission('scope.all_dependencies')) {
            $q->where(fn ($w) => $w->whereIn('dependency_id', $request->user()->dependencyIds())->orWhereNull('dependency_id'));
        }

        return $q;
    }

    protected function authorizeView(Request $request): void
    {
        if ($this->viewPermission === '') {
            return; // catálogo de referencia legible por cualquier funcionario autenticado
        }
        $u = $request->user();
        abort_unless($u->hasPermission($this->viewPermission) || $u->hasPermission($this->editPermission) || ($this->publishPermission && $u->hasPermission($this->publishPermission)), 403, 'No tiene permiso para consultar este recurso.');
    }

    protected function authorizeEdit(Request $request, ?Model $item = null): void
    {
        abort_unless($request->user()->hasPermission($this->editPermission), 403, 'No tiene permiso para modificar este recurso.');
        if ($item && $this->workflowField && $item->{$this->workflowField} === 'publicado' && ! ($this->publishPermission && $request->user()->hasPermission($this->publishPermission))) {
            abort(403, 'El contenido está publicado: solo un usuario con permiso de publicación puede modificarlo. Solicite su despublicación.');
        }
        if ($item && $this->scoped && $item->dependency_id !== null) {
            abort_unless($request->user()->inScope($item->dependency_id), 403, 'El registro pertenece a una dependencia fuera de su alcance.');
        }
    }

    public function index(Request $request)
    {
        $this->authorizeView($request);
        $q = $this->query($request);
        if ($term = trim((string) $request->query('q'))) {
            $q->where(function ($w) use ($term) {
                foreach ($this->searchable as $f) {
                    $w->orWhere($f, 'like', '%'.$term.'%');
                }
            });
        }
        foreach ($this->filterable as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }
        if ($this->workflowField && $request->filled('estado')) {
            $q->where($this->workflowField, $request->query('estado'));
        }
        $perPage = min(max((int) $request->query('per_page', 25), 1), 200);

        return $q->orderBy($this->orderBy, $this->orderDir)->paginate($perPage);
    }

    public function show(Request $request, int $id)
    {
        $this->authorizeView($request);
        $item = $this->query($request)->findOrFail($id);
        $data = $item->toArray();
        if ($this->workflowField) {
            $data['reviews'] = Review::with('reviewer:id,name')->where('reviewable_type', strtolower(class_basename($item)))->where('reviewable_id', $item->id)->orderBy('id')->get();
        }

        return $data;
    }

    public function store(Request $request)
    {
        $this->authorizeEdit($request);
        $data = $request->validate($this->rules($request, null));
        $data = $this->prepare($request, $data, null);
        if ($this->scoped && ! empty($data['dependency_id'])) {
            abort_unless($request->user()->inScope((int) $data['dependency_id']), 403, 'Dependencia fuera de su alcance.');
        }
        $item = ($this->model)::create($data);
        $this->afterSave($request, $item);

        return response()->json($this->show($request, $item->id), 201);
    }

    public function update(Request $request, int $id)
    {
        $item = $this->query($request)->findOrFail($id);
        $this->authorizeEdit($request, $item);
        $data = $request->validate($this->rules($request, $item));
        $data = $this->prepare($request, $data, $item);
        $item->update($data);
        $this->afterSave($request, $item);

        return $this->show($request, $item->id);
    }

    public function destroy(Request $request, int $id)
    {
        $item = $this->query($request)->findOrFail($id);
        $this->authorizeEdit($request, $item);
        if ($this->workflowField && $item->{$this->workflowField} === 'publicado') {
            abort(422, 'Despublique el contenido antes de eliminarlo.');
        }
        $item->delete();

        return response()->noContent();
    }

    /** Acciones del flujo editorial: enviar, devolver, publicar, despublicar. */
    public function workflow(Request $request, int $id, ContentWorkflow $wf)
    {
        abort_unless($this->workflowField !== null, 404);
        $item = $this->query($request)->findOrFail($id);
        $data = $request->validate(['action' => 'required|in:enviar,devolver,publicar,despublicar', 'comment' => 'nullable|string|max:2000']);
        if ($data['action'] === 'enviar') {
            $this->authorizeEdit($request, $item);
        } else {
            abort_unless($this->publishPermission && $request->user()->hasPermission($this->publishPermission), 403, 'No tiene permiso para revisar o publicar.');
        }
        $wf->transition($item, $data['action'], $request->user(), $data['comment'] ?? null, $this->workflowField, $this->workflowRequiresReview);

        return $this->show($request, $item->id);
    }

    protected function prepare(Request $request, array $data, ?Model $item): array
    {
        if ($this->slugFrom && isset($data[$this->slugFrom]) && (! $item || empty($item->slug))) {
            $base = Str::slug(Str::limit($data[$this->slugFrom], 120, '')) ?: 'item';
            $slug = $base;
            $i = 2;
            while (($this->model)::where('slug', $slug)->when($item, fn ($q) => $q->whereKeyNot($item->id))->exists()) {
                $slug = $base.'-'.$i++;
            }
            $data['slug'] = $slug;
        }

        return $data;
    }

    protected function afterSave(Request $request, Model $item): void {}
}
