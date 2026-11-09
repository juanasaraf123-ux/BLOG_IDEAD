<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class MediaItem extends Model
{
    use TracksChanges;

    protected $table = 'media_items';

    protected $guarded = ['id'];

    protected $casts = [
        'is_demo' => 'boolean',
        'image_authorized' => 'boolean',
        'publish_at' => 'datetime',
    ];

    public function file() { return $this->belongsTo(StoredFile::class, 'file_id'); }
    public function cat() { return $this->belongsTo(Cat::class); }
}
