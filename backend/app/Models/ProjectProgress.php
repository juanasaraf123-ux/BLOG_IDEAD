<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class ProjectProgress extends Model
{
    use TracksChanges;

    protected $table = 'project_progress';

    protected $guarded = ['id'];

    protected $casts = [
        'reported_on' => 'date',
        'progress_pct' => 'float',
        'executed_amount' => 'float',
    ];

    public function project() { return $this->belongsTo(Project::class); }
}
