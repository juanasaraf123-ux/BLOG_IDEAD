<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class CatalogItemController extends ResourceController
{
    protected string $model = \App\Models\CatalogItem::class;
    protected string $viewPermission = 'lists.edit';
    protected string $editPermission = 'lists.edit';
    protected array $with = ['cat:id,name', 'program:id,name'];
    protected ?string $publishPermission = 'entities.publish';
    protected ?string $workflowField = 'publication_status';
    protected array $searchable = ['title', 'category'];
    protected array $filterable = ['list_type', 'cat_id', 'program_id'];
    protected string $orderBy = 'id';
    protected string $orderDir = 'desc';
    protected bool $scoped = true;

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'list_type' => 'required|in:grupos_investigacion,semilleros,plataformas_digitales,formacion_continua,opciones_grado,hitos_oferta,representacion_estudiantil,planes_mejoramiento,servicios_bienestar',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'category' => 'nullable|string|max:120',
            'url' => ['nullable', 'string', 'max:255', 'regex:#^https://#'],
            'state' => 'nullable|string|max:60',
            'year' => 'nullable|integer|between:1950,2100',
            'date' => 'nullable|date',
            'cat_id' => 'nullable|exists:cats,id',
            'program_id' => 'nullable|exists:programs,id',
            'dependency_id' => 'nullable|exists:dependencies,id',
        ];
    }
}
