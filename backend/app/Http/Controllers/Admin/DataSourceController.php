<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class DataSourceController extends ResourceController
{
    protected string $model = \App\Models\DataSource::class;
    protected string $viewPermission = '';
    protected string $editPermission = 'catalogs.manage';
    protected array $searchable = ['code', 'name'];
    protected string $orderBy = 'code';
    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'code' => ['required', 'string', 'max:60', \Illuminate\Validation\Rule::unique('data_sources', 'code')->ignore($item?->id)],
            'name' => 'required|string|max:255',
            'kind' => 'required|in:dependencia,sistema,base_datos,externo,acto_administrativo,persona',
            'official_name_status' => 'required|in:validado,pendiente',
        ];
    }
}
