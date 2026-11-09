<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class EducationLevel extends Model
{
    use TracksChanges;

    protected $table = 'education_levels';

    protected $guarded = ['id'];

    public $timestamps = false;
}
