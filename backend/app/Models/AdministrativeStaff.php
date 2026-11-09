<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdministrativeStaff extends Model
{
    protected $table = 'administrative_staff';

    protected $guarded = ['id'];

    protected $casts = [
        'trained_in_period' => 'boolean',
    ];

    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
}
