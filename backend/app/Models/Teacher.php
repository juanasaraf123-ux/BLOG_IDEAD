<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $table = 'teachers';

    protected $guarded = ['id'];

    protected $casts = [
        'in_research_group' => 'boolean',
        'in_research_seedbed' => 'boolean',
        'teaching_seminar' => 'boolean',
    ];

    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function assignments() { return $this->hasMany(TeacherAssignment::class); }
}
