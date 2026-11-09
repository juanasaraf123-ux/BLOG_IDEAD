<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class NewsController extends ResourceController
{
    protected string $model = \App\Models\News::class;
    protected string $viewPermission = 'content.create';
    protected string $editPermission = 'content.create';
    protected array $with = ['category', 'cover', 'cat:id,name', 'author:id,name'];
    protected ?string $publishPermission = 'content.publish';
    protected ?string $workflowField = 'status';
    protected array $searchable = ['title', 'summary'];
    protected array $filterable = ['category_id', 'cat_id'];
    protected string $orderBy = 'id';
    protected string $orderDir = 'desc';
    protected ?string $slugFrom = 'title';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string|max:500',
            'body' => 'nullable|string|max:200000',
            'category_id' => 'nullable|exists:news_categories,id',
            'cover_file_id' => 'nullable|exists:files,id',
            'cat_id' => 'nullable|exists:cats,id',
            'is_featured' => 'boolean',
            'publish_at' => 'nullable|date',
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
