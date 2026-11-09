<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $table = 'reviews';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function reviewer() { return $this->belongsTo(User::class, 'reviewer_id'); }
}
