<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class HomeHighlightController extends ResourceController
{
    protected string $model = \App\Models\HomeHighlight::class;
    protected string $viewPermission = 'content.site';
    protected string $editPermission = 'content.site';
    protected array $with = ['indicator:id,code,name'];
    protected array $searchable = ['label'];
    protected string $orderBy = 'sort';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'label' => 'required|string|max:120',
            'icon' => 'required|in:building,students,teacher,pin,graduation,calendar,graduate,project,money,book',
            'metric_type' => 'required|in:indicator,events_year,cats_count,programs_count',
            'indicator_id' => 'required_if:metric_type,indicator|nullable|exists:indicators,id',
            'classifier_item_id' => 'nullable|exists:classifier_items,id',
            'link' => ['nullable', 'string', 'max:255', 'regex:#^(/|https://)#'],
            'sort' => 'integer|min:0',
            'is_active' => 'boolean',
        ];
    }
}
