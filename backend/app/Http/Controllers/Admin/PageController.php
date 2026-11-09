<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PageController extends ResourceController
{
    protected string $model = \App\Models\Page::class;
    protected string $viewPermission = 'content.create';
    protected string $editPermission = 'content.create';
    protected ?string $publishPermission = 'content.publish';
    protected ?string $workflowField = 'status';
    protected array $searchable = ['title', 'slug'];
    protected string $orderBy = 'id';
    protected string $orderDir = 'desc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'slug' => ['required', 'alpha_dash', 'max:120', \Illuminate\Validation\Rule::unique('pages', 'slug')->ignore($item?->id)],
            'title' => 'required|string|max:255',
            'body' => 'nullable|string|max:300000',
        ];
    }

    protected function prepare(Request $request, array $data, ?Model $item): array
    {
        if (! $item) {
            $data['author_id'] = $request->user()->id;
            $data['status'] = 'borrador';
        }

        return parent::prepare($request, $data, $item);
    }

    public function __construct()
    {
        $this->workflowRequiresReview = (bool) (int) \App\Services\Settings::get('news_requires_review', 1);
    }
}
