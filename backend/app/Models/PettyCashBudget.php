<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class PettyCashBudget extends Model
{
    use TracksChanges;

    protected $table = 'petty_cash_budgets';

    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'float',
    ];

    public function expenses() { return $this->hasMany(PettyCashExpense::class, 'budget_id'); }
}
