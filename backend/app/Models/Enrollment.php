<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $table = 'enrollments';

    protected $guarded = ['id'];

    protected $casts = [
        'document_number' => 'encrypted',
        'full_name' => 'encrypted',
        'email' => 'encrypted',
        'phone' => 'encrypted',
        'is_new' => 'boolean',
        'is_student_representative' => 'boolean',
        'academic_average' => 'float',
        'special_population' => 'encrypted:array',
    ];

    /** Datos sensibles: nunca se serializan por defecto. */
    protected $hidden = ['document_number', 'full_name', 'email', 'phone', 'special_population'];

    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function program() { return $this->belongsTo(Program::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
    public function residenceMunicipality() { return $this->belongsTo(Municipality::class, 'residence_municipality_id'); }
    public function import() { return $this->belongsTo(RecordImport::class, 'import_id'); }
}
