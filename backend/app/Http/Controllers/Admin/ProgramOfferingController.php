<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ProgramOfferingController extends ResourceController
{
    protected string $model = \App\Models\ProgramOffering::class;
    protected string $viewPermission = 'programs.edit';
    protected string $editPermission = 'programs.edit';
    protected array $with = ['program:id,name', 'cat:id,name', 'period:id,code'];
    protected array $searchable = ['act_reference'];
    protected array $filterable = ['program_id', 'cat_id', 'period_id'];
    protected string $orderBy = 'id';
    protected string $orderDir = 'desc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'program_id' => 'required|exists:programs,id',
            'cat_id' => 'required|exists:cats,id',
            'period_id' => ['required', 'exists:academic_periods,id', \Illuminate\Validation\Rule::unique('program_offerings')->where(fn ($q) => $q->where('program_id', $request->input('program_id'))->where('cat_id', $request->input('cat_id')))->ignore($item?->id)],
            'admits_new' => 'boolean',
            'approved_quota' => 'nullable|integer|min:0',
            'act_reference' => 'nullable|string|max:255',
        ];
    }
}
