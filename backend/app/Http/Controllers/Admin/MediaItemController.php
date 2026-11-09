<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class MediaItemController extends ResourceController
{
    protected string $model = \App\Models\MediaItem::class;
    protected string $viewPermission = 'media.manage';
    protected string $editPermission = 'media.manage';
    protected array $with = ['file', 'cat:id,name'];
    protected ?string $publishPermission = 'content.publish';
    protected ?string $workflowField = 'status';
    protected array $searchable = ['title', 'album'];
    protected array $filterable = ['type', 'album', 'cat_id'];
    protected string $orderBy = 'id';
    protected string $orderDir = 'desc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'title' => 'required|string|max:255',
            'type' => 'required|in:foto,video',
            'file_id' => 'required_if:type,foto|nullable|exists:files,id',
            'video_url' => ['required_if:type,video', 'nullable', 'url', 'regex:#^https://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|vimeo\.com/)[\w\-?=&]+$#'],
            'description' => 'nullable|string|max:2000',
            'album' => 'nullable|string|max:120',
            'cat_id' => 'nullable|exists:cats,id',
            'image_authorized' => 'boolean',
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

    public function workflow(Request $request, int $id, \App\Services\ContentWorkflow $wf)
    {
        $item = $this->query($request)->findOrFail($id);
        if ($request->input('action') === 'publicar' && $item->type === 'foto' && ! $item->image_authorized) {
            abort(422, 'No se puede publicar una fotografía sin autorización de uso de imagen.');
        }

        return parent::workflow($request, $id, $wf);
    }
}
