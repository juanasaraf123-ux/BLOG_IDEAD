<?php

namespace App\Models;

use App\Models\Concerns\SanitizesHtml;
use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use TracksChanges, SanitizesHtml;

    protected $table = 'projects';

    protected $guarded = ['id'];

    protected array $htmlAttributes = ['description'];

    protected $casts = [
        'is_demo' => 'boolean',
        'approved_amount' => 'float',
        'executed_amount' => 'float',
        'progress_pct' => 'float',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function cats() { return $this->belongsToMany(Cat::class); }
    public function progress() { return $this->hasMany(ProjectProgress::class)->orderBy('reported_on'); }
    public function agreements() { return $this->hasMany(Agreement::class); }
    public function cover() { return $this->belongsTo(StoredFile::class, 'cover_file_id'); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
}
