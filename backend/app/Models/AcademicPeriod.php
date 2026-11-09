<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class AcademicPeriod extends Model
{
    use TracksChanges;

    protected $table = 'academic_periods';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
    ];
}
