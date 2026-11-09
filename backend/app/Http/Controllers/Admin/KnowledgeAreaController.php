<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class KnowledgeAreaController extends ResourceController
{
    protected string $model = \App\Models\KnowledgeArea::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $searchable = ['name'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'alpha_dash', 'max:40', \Illuminate\Validation\Rule::unique('knowledge_areas', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:255',
            'classification' => 'required|in:NBC,CINE-F,pendiente',
        ];
    }
}
