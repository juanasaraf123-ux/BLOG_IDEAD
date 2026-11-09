<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class NewsCategoryController extends ResourceController
{
    protected string $model = \App\Models\NewsCategory::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'content.site';
    protected array $searchable = ['name'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';
    protected ?string $slugFrom = 'name';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'name' => 'required|string|max:120',
        ];
    }
}
