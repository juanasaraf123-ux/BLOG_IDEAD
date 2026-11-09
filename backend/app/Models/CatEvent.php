<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class CatEvent extends Model
{
    use TracksChanges;

    protected $table = 'cat_events';

    protected $guarded = ['id'];

    protected $casts = [
        'event_date' => 'date:Y-m-d',
    ];

    public function cat() { return $this->belongsTo(Cat::class); }
}
