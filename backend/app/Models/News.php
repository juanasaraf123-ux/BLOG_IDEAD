<?php

namespace App\Models;

use App\Models\Concerns\SanitizesHtml;
use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use TracksChanges, SanitizesHtml;

    protected $table = 'news';

    protected $guarded = ['id'];

    protected array $htmlAttributes = ['body'];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_demo' => 'boolean',
        'publish_at' => 'datetime',
    ];

    public function category() { return $this->belongsTo(NewsCategory::class); }
    public function cover() { return $this->belongsTo(StoredFile::class, 'cover_file_id'); }
    public function cat() { return $this->belongsTo(Cat::class); }
    public function author() { return $this->belongsTo(User::class, 'author_id'); }
}
