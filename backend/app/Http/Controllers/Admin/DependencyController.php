<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class DependencyController extends ResourceController
{
    protected string $model = \App\Models\Dependency::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $searchable = ['code', 'name'];
    protected string $orderBy = 'code';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'string', 'max:40', \Illuminate\Validation\Rule::unique('dependencies', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'parent_id' => 'nullable|exists:dependencies,id',
            'is_active' => 'boolean',
        ];
    }
}
