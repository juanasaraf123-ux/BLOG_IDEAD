<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class UpdateRequest extends Model
{
    use TracksChanges;

    protected $table = 'update_requests';

    protected $guarded = ['id'];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'attended_at' => 'datetime',
    ];

    public function indicator() { return $this->belongsTo(Indicator::class); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by'); }
    public function attendant() { return $this->belongsTo(User::class, 'attended_by'); }
    public function submission() { return $this->belongsTo(DataSubmission::class, 'submission_id'); }
}
