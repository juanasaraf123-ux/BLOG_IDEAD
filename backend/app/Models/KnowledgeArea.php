<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class KnowledgeArea extends Model
{
    use TracksChanges;

    protected $table = 'knowledge_areas';

    protected $guarded = ['id'];

    public $timestamps = false;
}
