<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $table = 'departments';

    protected $guarded = ['id'];

    public $timestamps = false;

    public function municipalities() { return $this->hasMany(Municipality::class); }
}
