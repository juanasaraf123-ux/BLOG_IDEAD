<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AgreementController extends ResourceController
{
    protected string $model = \App\Models\Agreement::class;
    protected string $viewPermission = 'agreements.view';
    protected string $editPermission = 'agreements.manage';
    protected array $with = ['project:id,name', 'dependency:id,code,name'];
    protected array $searchable = ['counterpart', 'number', 'object'];
    protected array $filterable = ['status'];
    protected string $orderBy = 'id';
    protected string $orderDir = 'desc';
    protected bool $scoped = true;

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'number' => 'nullable|string|max:60',
            'counterpart' => 'required|string|max:255',
            'object' => 'required|string|max:5000',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|in:vigente,terminado,en_liquidacion',
            'contributed_amount' => 'nullable|numeric|min:0',
            'is_public' => 'boolean',
            'dependency_id' => 'nullable|exists:dependencies,id',
            'project_id' => 'nullable|exists:projects,id',
        ];
    }
}
