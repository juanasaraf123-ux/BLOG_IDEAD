<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class ProgramOffering extends Model
{
    use TracksChanges;

    protected $table = 'program_offerings';

    protected $guarded = ['id'];

    protected $casts = [
        'admits_new' => 'boolean',
        'is_demo' => 'boolean',
    ];

    public function program() { return $this->belongsTo(Program::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
}
