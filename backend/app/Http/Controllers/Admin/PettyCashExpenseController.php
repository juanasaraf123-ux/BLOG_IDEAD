<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PettyCashExpenseController extends ResourceController
{
    protected string $model = \App\Models\PettyCashExpense::class;
    protected string $viewPermission = 'petty_cash.view';
    protected string $editPermission = 'petty_cash.manage';
    protected array $with = ['budget:id,name,year', 'document:id,title'];
    protected array $searchable = ['concept', 'provider', 'invoice_number'];
    protected array $filterable = ['budget_id', 'status'];
    protected string $orderBy = 'expense_date';
    protected string $orderDir = 'desc';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'budget_id' => 'required|exists:petty_cash_budgets,id',
            'expense_date' => 'required|date',
            'concept' => 'required|string|max:255',
            'provider' => 'nullable|string|max:255',
            'invoice_number' => 'nullable|string|max:60',
            'amount' => 'required|numeric|min:0.01',
            'document_id' => 'nullable|exists:documents,id',
            'status' => 'required|in:registrado,legalizado,anulado',
        ];
    }

    protected function prepare(Request $request, array $data, ?Model $item): array
    {
        if (! empty($data['document_id'])) {
            $doc = \App\Models\Document::findOrFail($data['document_id']);
            abort_unless($doc->confidentiality === 'financiero', 422, 'El soporte debe ser un documento clasificado como financiero.');
        }
        if (! $item) {
            $data['created_by'] = $request->user()->id;
        }

        return $data;
    }
}
