<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class CatSite extends Model
{
    use TracksChanges;

    protected $table = 'cat_sites';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function cat() { return $this->belongsTo(Cat::class); }
}
