<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class TeamUnitController extends ResourceController
{
    protected string $model = \App\Models\TeamUnit::class;
    protected string $viewPermission = 'content.site';
    protected string $editPermission = 'content.site';
    protected array $searchable = ['name'];
    protected string $orderBy = 'sort';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:3000',
            'icon' => 'nullable|string|max:40',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:60',
            'link' => ['nullable', 'string', 'max:255', 'regex:#^(/|https://)#'],
            'sort' => 'integer|min:0',
            'is_active' => 'boolean',
        ];
    }
}
