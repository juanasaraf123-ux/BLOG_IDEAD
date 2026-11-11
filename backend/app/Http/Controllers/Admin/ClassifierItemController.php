<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ClassifierItemController extends ResourceController
{
    protected string $model = \App\Models\ClassifierItem::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $with = ['classifier:id,name'];
    protected array $searchable = ['label', 'code'];
    protected array $filterable = ['classifier_id'];
    protected string $orderBy = 'sort';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'classifier_id' => 'required|exists:classifiers,id',
            'code' => ['required', 'alpha_dash', 'max:60', \Illuminate\Validation\Rule::unique('classifier_items')->where(fn ($q) => $q->where('classifier_id', $request->input('classifier_id')))->ignore($item?->id)],
            'label' => 'required|string|max:255',
            'sort' => 'integer|min:0',
        ];
    }
}
