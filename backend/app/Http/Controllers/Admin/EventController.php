<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class EventController extends ResourceController
{
    protected string $model = \App\Models\Event::class;
    protected string $viewPermission = 'content.create';
    protected string $editPermission = 'content.create';
    protected array $with = ['cover', 'cat:id,name'];
    protected ?string $publishPermission = 'content.publish';
    protected ?string $workflowField = 'status';
    protected array $searchable = ['title', 'location'];
    protected array $filterable = ['category', 'cat_id'];
    protected string $orderBy = 'starts_at';
    protected string $orderDir = 'desc';
    protected ?string $slugFrom = 'title';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string|max:500',
            'body' => 'nullable|string|max:200000',
            'category' => 'nullable|in:académica,cultural,deportiva,bienestar,institucional,investigación,extensión',
            'starts_at' => 'required|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'location' => 'nullable|string|max:255',
            'cat_id' => 'nullable|exists:cats,id',
            'cover_file_id' => 'nullable|exists:files,id',
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
