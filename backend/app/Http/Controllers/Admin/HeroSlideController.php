<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class HeroSlideController extends ResourceController
{
    protected string $model = \App\Models\HeroSlide::class;
    protected string $viewPermission = 'content.site';
    protected string $editPermission = 'content.site';
    protected array $with = ['image'];
    protected array $searchable = ['title'];
    protected string $orderBy = 'sort';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image_file_id' => 'nullable|exists:files,id',
            'link_url' => ['nullable', 'string', 'max:255', 'regex:#^(/|https://)#'],
            'sort' => 'integer|min:0',
            'is_active' => 'boolean',
            'starts_on' => 'nullable|date',
            'ends_on' => 'nullable|date|after_or_equal:starts_on',
        ];
    }
}
