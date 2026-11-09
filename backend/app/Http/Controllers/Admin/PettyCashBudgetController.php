<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PettyCashBudgetController extends ResourceController
{
    protected string $model = \App\Models\PettyCashBudget::class;
    protected string $viewPermission = 'petty_cash.view';
    protected string $editPermission = 'petty_cash.manage';
    protected array $searchable = ['name'];
    protected array $filterable = ['year'];
    protected string $orderBy = 'year';
    protected string $orderDir = 'desc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'year' => 'required|integer|between:2000,2100',
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:2000',
        ];
    }

    protected function query(Request $request): \Illuminate\Database\Eloquent\Builder
    {
        return parent::query($request)->withSum(['expenses as spent' => fn ($q) => $q->where('status', '!=', 'anulado')], 'amount');
    }

    protected function prepare(Request $request, array $data, ?Model $item): array
    {
        if (! $item) {
            $data['created_by'] = $request->user()->id;
        }

        return $data;
    }
}
