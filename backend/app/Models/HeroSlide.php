<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class HeroSlide extends Model
{
    use TracksChanges;

    protected $table = 'hero_slides';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'is_demo' => 'boolean',
        'starts_on' => 'date',
        'ends_on' => 'date',
    ];

    public function image() { return $this->belongsTo(StoredFile::class, 'image_file_id'); }
}
