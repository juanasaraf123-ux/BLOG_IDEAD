<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Graduation extends Model
{
    protected $table = 'graduations';

    protected $guarded = ['id'];

    /** Datos personales cifrados: nunca se serializan por defecto (solo se muestran a roles autorizados). */
    protected $hidden = ['document_number', 'full_name', 'email', 'phone'];

    protected $casts = [
        'document_number' => 'encrypted',
        'full_name' => 'encrypted',
        'email' => 'encrypted',
        'phone' => 'encrypted',
        'graduation_date' => 'date:Y-m-d',
        'final_average' => 'float',
    ];

    public function program() { return $this->belongsTo(Program::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function cohort() { return $this->belongsTo(AcademicPeriod::class, 'cohort_period_id'); }
}
