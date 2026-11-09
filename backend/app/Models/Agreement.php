<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Agreement extends Model
{
    use TracksChanges;

    protected $table = 'agreements';

    protected $guarded = ['id'];

    protected $casts = [
        'is_public' => 'boolean',
        'is_demo' => 'boolean',
        'contributed_amount' => 'float',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function project() { return $this->belongsTo(Project::class); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
}
