<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class CatFacility extends Model
{
    use TracksChanges;

    protected $table = 'cat_facilities';

    protected $guarded = ['id'];

    public function cat() { return $this->belongsTo(Cat::class); }
}
