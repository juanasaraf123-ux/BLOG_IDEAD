<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class RecordImport extends Model
{
    use TracksChanges;

    protected $table = 'record_imports';

    protected $guarded = ['id'];

    protected $casts = [
        'errors' => 'array',
    ];

    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function file() { return $this->belongsTo(StoredFile::class, 'file_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
