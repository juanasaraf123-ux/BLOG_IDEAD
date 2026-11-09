<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Municipality extends Model
{
    use TracksChanges;

    protected $table = 'municipalities';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function department() { return $this->belongsTo(Department::class); }
}
