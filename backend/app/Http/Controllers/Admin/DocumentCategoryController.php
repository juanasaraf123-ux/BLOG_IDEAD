<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class DocumentCategoryController extends ResourceController
{
    protected string $model = \App\Models\DocumentCategory::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $searchable = ['name'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'alpha_dash', 'max:60', \Illuminate\Validation\Rule::unique('document_categories', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:255',
            'default_confidentiality' => 'required|in:publico,interno,restringido,financiero',
        ];
    }
}
