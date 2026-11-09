<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AcademicPeriodController extends ResourceController
{
    protected string $model = \App\Models\AcademicPeriod::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $searchable = ['code'];
    protected string $orderBy = 'code';
    protected string $orderDir = 'desc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'string', 'max:20', 'regex:/^\d{4}(-[0-9A-Z]{1,2})?$/', \Illuminate\Validation\Rule::unique('academic_periods', 'code')->ignore($item?->id)],
            'year' => 'required|integer|between:1950,2100',
            'term' => 'nullable|integer|between:1,4',
            'type' => 'required|in:semestre,anio,vigencia,cohorte',
            'starts_on' => 'nullable|date',
            'ends_on' => 'nullable|date|after_or_equal:starts_on',
        ];
    }
}
