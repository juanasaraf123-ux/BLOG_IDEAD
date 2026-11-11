<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ProjectProgressController extends ResourceController
{
    protected string $model = \App\Models\ProjectProgress::class;
    protected string $viewPermission = 'projects.edit';
    protected string $editPermission = 'projects.edit';
    protected array $with = ['project:id,name'];
    protected array $searchable = ['note'];
    protected array $filterable = ['project_id'];
    protected string $orderBy = 'reported_on';
    protected string $orderDir = 'desc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'project_id' => 'required|exists:projects,id',
            'reported_on' => 'required|date',
            'progress_pct' => 'required|numeric|between:0,100',
            'executed_amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:255',
        ];
    }

    protected function afterSave(Request $request, Model $item): void
    {
        $latest = \App\Models\ProjectProgress::where('project_id', $item->project_id)->orderByDesc('reported_on')->orderByDesc('id')->first();
        $item->project->update(['progress_pct' => $latest->progress_pct, 'executed_amount' => $latest->executed_amount ?? $item->project->executed_amount]);
    }
}
