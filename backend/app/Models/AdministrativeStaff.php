<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdministrativeStaff extends Model
{
    protected $table = 'administrative_staff';

    protected $guarded = ['id'];

    /** Datos personales cifrados: nunca se serializan por defecto (solo se muestran a roles autorizados). */
    protected $hidden = ['document_number', 'full_name', 'email', 'phone'];

    protected $casts = [
        'document_number' => 'encrypted',
        'full_name' => 'encrypted',
        'email' => 'encrypted',
        'phone' => 'encrypted',
        'trained_in_period' => 'boolean',
        'contract_start' => 'date:Y-m-d',
        'contract_end' => 'date:Y-m-d',
    ];

    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
}
