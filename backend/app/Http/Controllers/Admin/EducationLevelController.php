<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class EducationLevelController extends ResourceController
{
    protected string $model = \App\Models\EducationLevel::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $searchable = ['name'];
    protected string $orderBy = 'sort';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'alpha_dash', 'max:40', \Illuminate\Validation\Rule::unique('education_levels', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:120',
            'cycle' => 'required|in:pregrado,posgrado',
            'sort' => 'integer|min:0',
        ];
    }
}
