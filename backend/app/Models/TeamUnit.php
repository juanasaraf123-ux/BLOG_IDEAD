<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class TeamUnit extends Model
{
    use TracksChanges;

    protected $table = 'team_units';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
