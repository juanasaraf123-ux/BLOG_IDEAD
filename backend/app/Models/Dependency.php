<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Dependency extends Model
{
    use TracksChanges;

    protected $table = 'dependencies';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users() { return $this->belongsToMany(User::class); }
    public function parent() { return $this->belongsTo(Dependency::class, 'parent_id'); }
}
