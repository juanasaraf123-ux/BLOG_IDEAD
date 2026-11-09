<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class PettyCashExpense extends Model
{
    use TracksChanges;

    protected $table = 'petty_cash_expenses';

    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'float',
        'expense_date' => 'date:Y-m-d',
    ];

    public function budget() { return $this->belongsTo(PettyCashBudget::class, 'budget_id'); }
    public function document() { return $this->belongsTo(Document::class); }
}
