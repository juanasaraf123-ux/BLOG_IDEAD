<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Graduation extends Model
{
    protected $table = 'graduations';

    protected $guarded = ['id'];

    protected $casts = [
        'graduation_date' => 'date:Y-m-d',
        'final_average' => 'float',
    ];

    public function program() { return $this->belongsTo(Program::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function cohort() { return $this->belongsTo(AcademicPeriod::class, 'cohort_period_id'); }
}
