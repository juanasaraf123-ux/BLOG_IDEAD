<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class CatalogItem extends Model
{
    use TracksChanges;

    protected $table = 'catalog_items';

    protected $guarded = ['id'];

    protected $casts = [
        'is_demo' => 'boolean',
        'date' => 'date',
    ];

    public function cat() { return $this->belongsTo(Cat::class); }
    public function program() { return $this->belongsTo(Program::class); }
}
