<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use TracksChanges;

    protected $table = 'roles';

    protected $guarded = ['id'];

    public function permissions() { return $this->belongsToMany(Permission::class); }
    public function users() { return $this->belongsToMany(User::class); }
}
