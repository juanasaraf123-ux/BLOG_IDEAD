<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ClassifierController extends ResourceController
{
    protected string $model = \App\Models\Classifier::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $with = ['items'];
    protected array $searchable = ['name'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'alpha_dash', 'max:60', \Illuminate\Validation\Rule::unique('classifiers', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:255',
            'is_partition' => 'boolean',
        ];
    }
}
