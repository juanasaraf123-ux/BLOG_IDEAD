<?php

namespace App\Models;

use App\Models\Concerns\SanitizesHtml;
use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use TracksChanges, SanitizesHtml;

    protected $table = 'events';

    protected $guarded = ['id'];

    protected array $htmlAttributes = ['body'];

    protected $casts = [
        'is_demo' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'publish_at' => 'datetime',
    ];

    public function cover() { return $this->belongsTo(StoredFile::class, 'cover_file_id'); }
    public function cat() { return $this->belongsTo(Cat::class); }
}
