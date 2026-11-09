<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class ClassifierItem extends Model
{
    use TracksChanges;

    protected $table = 'classifier_items';

    protected $guarded = ['id'];

    public $timestamps = false;

    public function classifier() { return $this->belongsTo(Classifier::class); }
}
