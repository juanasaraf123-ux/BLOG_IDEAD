<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class HomeHighlight extends Model
{
    use TracksChanges;

    protected $table = 'home_highlights';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function indicator() { return $this->belongsTo(Indicator::class); }
    public function classifierItem() { return $this->belongsTo(ClassifierItem::class); }
}
