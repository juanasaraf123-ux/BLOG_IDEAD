<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class MunicipalityController extends ResourceController
{
    protected string $model = \App\Models\Municipality::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $with = ['department:id,name'];
    protected array $searchable = ['name', 'code'];
    protected array $filterable = ['department_id'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'department_id' => 'required|exists:departments,id',
            'code' => ['nullable', 'digits:5', \Illuminate\Validation\Rule::unique('municipalities', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:120',
            'latitude' => 'nullable|numeric|between:-5,14',
            'longitude' => 'nullable|numeric|between:-82,-66',
        ];
    }
}
