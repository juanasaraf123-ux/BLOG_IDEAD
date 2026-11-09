<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
