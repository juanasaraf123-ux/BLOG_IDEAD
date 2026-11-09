<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ProgramController extends ResourceController
{
    protected string $model = \App\Models\Program::class;
    protected string $viewPermission = 'programs.edit';
    protected string $editPermission = 'programs.edit';
    protected array $with = ['level', 'area'];
    protected ?string $publishPermission = 'entities.publish';
    protected ?string $workflowField = 'publication_status';
    protected array $searchable = ['name', 'snies_code'];
    protected array $filterable = ['level_id', 'area_id', 'status'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';
    protected bool $scoped = true;
    protected ?string $slugFrom = 'name';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'name' => 'required|string|max:255',
            'snies_code' => ['nullable', 'string', 'max:20', \Illuminate\Validation\Rule::unique('programs', 'snies_code')->ignore($item?->id)],
            'level_id' => 'required|exists:education_levels,id',
            'area_id' => 'nullable|exists:knowledge_areas,id',
            'dependency_id' => 'nullable|exists:dependencies,id',
            'modality' => 'required|string|max:40',
            'duration_semesters' => 'nullable|integer|min:1|max:20',
            'credits' => 'nullable|integer|min:1|max:400',
            'description' => 'nullable|string|max:50000',
            'qualified_registry_until' => 'nullable|date',
            'accreditation_until' => 'nullable|date',
            'status' => 'required|in:activo,en_cierre,proyectado,inactivo',
        ];
    }
}
