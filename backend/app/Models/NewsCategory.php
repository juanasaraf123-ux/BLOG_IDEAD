<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class NewsCategory extends Model
{
    use TracksChanges;

    protected $table = 'news_categories';

    protected $guarded = ['id'];

    public $timestamps = false;
}
