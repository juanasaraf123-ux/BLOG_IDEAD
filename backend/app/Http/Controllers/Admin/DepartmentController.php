<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class DepartmentController extends ResourceController
{
    protected string $model = \App\Models\Department::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $searchable = ['name', 'code'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'digits:2', \Illuminate\Validation\Rule::unique('departments', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:120',
        ];
    }
}
