<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ProjectController extends ResourceController
{
    protected string $model = \App\Models\Project::class;
    protected string $viewPermission = 'projects.edit';
    protected string $editPermission = 'projects.edit';
    protected array $with = ['cats:id,name', 'progress', 'cover'];
    protected ?string $publishPermission = 'entities.publish';
    protected ?string $workflowField = 'publication_status';
    protected array $searchable = ['name', 'code'];
    protected array $filterable = ['status', 'investment_line'];
    protected string $orderBy = 'id';
    protected string $orderDir = 'desc';
    protected bool $scoped = true;
    protected ?string $slugFrom = 'name';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:40',
            'objective' => 'nullable|string|max:5000',
            'description' => 'nullable|string|max:100000',
            'investment_line' => 'nullable|in:infraestructura,equipos,tecnologia,academia,bienestar,investigacion,otra',
            'status' => 'required|in:radicado,aprobado,en_ejecucion,finalizado,suspendido',
            'location' => 'nullable|string|max:255',
            'approved_amount' => 'nullable|numeric|min:0',
            'executed_amount' => 'nullable|numeric|min:0',
            'progress_pct' => 'nullable|numeric|between:0,100',
            'beneficiaries_count' => 'nullable|integer|min:0',
            'results' => 'nullable|string|max:20000',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'dependency_id' => 'nullable|exists:dependencies,id',
            'cover_file_id' => 'nullable|exists:files,id',
            'cat_ids' => 'array',
            'cat_ids.*' => 'exists:cats,id',
        ];
    }

    protected function prepare(Request $request, array $data, ?Model $item): array
    {
        unset($data['cat_ids']);

        return parent::prepare($request, $data, $item);
    }

    protected function afterSave(Request $request, Model $item): void
    {
        if ($request->has('cat_ids')) {
            $item->cats()->sync($request->input('cat_ids', []));
        }
    }
}
