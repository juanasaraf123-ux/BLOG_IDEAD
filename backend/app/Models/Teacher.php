<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $table = 'teachers';

    protected $guarded = ['id'];

    /** Datos personales cifrados: nunca se serializan por defecto (solo se muestran a roles autorizados). */
    protected $hidden = ['document_number', 'full_name', 'email', 'phone'];

    protected $casts = [
        'document_number' => 'encrypted',
        'full_name' => 'encrypted',
        'email' => 'encrypted',
        'phone' => 'encrypted',
        'in_research_group' => 'boolean',
        'in_research_seedbed' => 'boolean',
        'teaching_seminar' => 'boolean',
    ];

    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function assignments() { return $this->hasMany(TeacherAssignment::class); }
}
