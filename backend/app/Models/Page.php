<?php

namespace App\Models;

use App\Models\Concerns\SanitizesHtml;
use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use TracksChanges, SanitizesHtml;

    protected $table = 'pages';

    protected $guarded = ['id'];

    protected array $htmlAttributes = ['body'];

    protected $casts = [
        'publish_at' => 'datetime',
    ];
}
