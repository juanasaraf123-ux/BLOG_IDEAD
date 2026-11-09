<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class DataSource extends Model
{
    use TracksChanges;

    protected $table = 'data_sources';

    protected $guarded = ['id'];

    public $timestamps = false;

    public function indicators() { return $this->belongsToMany(Indicator::class); }
}
