<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** Publicaciones (producción académica y publicaciones institucionales). Publica el Director. */
class PublicationController extends ResourceController
{
    protected string $model = \App\Models\Publication::class;
    protected string $viewPermission = 'lists.edit';
    protected string $editPermission = 'lists.edit';
    protected array $with = ['program:id,name', 'researchGroup:id,title', 'document:id,title'];
    protected ?string $publishPermission = 'entities.publish';
    protected ?string $workflowField = 'publication_status';
    protected array $searchable = ['title', 'authors', 'publisher'];
    protected array $filterable = ['publication_type', 'year', 'program_id'];
    protected string $orderBy = 'year';
    protected bool $scoped = true;
    protected ?string $slugFrom = 'title';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'title' => 'required|string|max:255',
            'publication_type' => 'required|in:articulo,libro,capitulo,ponencia,creacion,revista,boletin,informe',
            'authors' => 'nullable|string|max:2000',
            'year' => 'required|integer|between:1950,2100',
            'publisher' => 'nullable|string|max:255',
            'isbn_issn' => 'nullable|string|max:30',
            'doi' => 'nullable|string|max:120',
            'url' => ['nullable', 'string', 'max:255', 'regex:#^https://#'],
            'abstract' => 'nullable|string|max:10000',
            'program_id' => 'nullable|exists:programs,id',
            'dependency_id' => 'nullable|exists:dependencies,id',
            'research_group_id' => 'nullable|exists:catalog_items,id',
            'document_id' => 'nullable|exists:documents,id',
        ];
    }
}
