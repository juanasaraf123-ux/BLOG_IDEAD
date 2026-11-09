<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class DataSubmission extends Model
{
    use TracksChanges;

    protected $table = 'data_submissions';

    protected $guarded = ['id'];

    protected $casts = [
        'is_demo' => 'boolean',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function indicator() { return $this->belongsTo(Indicator::class); }
    public function values() { return $this->hasMany(IndicatorValue::class, 'submission_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function submitter() { return $this->belongsTo(User::class, 'submitted_by'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
    public function publisher() { return $this->belongsTo(User::class, 'published_by'); }
    public function sourceFile() { return $this->belongsTo(StoredFile::class, 'source_file_id'); }
    public function reviews() { return $this->hasMany(Review::class, 'reviewable_id')->where('reviewable_type', 'submission')->orderBy('id'); }
}
