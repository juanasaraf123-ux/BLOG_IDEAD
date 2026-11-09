<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChangeHistory extends Model
{
    protected $table = 'change_history';

    protected $guarded = ['id'];

    public $timestamps = true;

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
    ];

    const UPDATED_AT = null;
    public function user() { return $this->belongsTo(User::class); }
}
