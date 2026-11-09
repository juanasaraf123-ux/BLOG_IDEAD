<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Classifier extends Model
{
    use TracksChanges;

    protected $table = 'classifiers';

    protected $guarded = ['id'];

    protected $casts = ['is_partition' => 'boolean'];

    public $timestamps = false;

    public function items() { return $this->hasMany(ClassifierItem::class)->orderBy('sort'); }
}
