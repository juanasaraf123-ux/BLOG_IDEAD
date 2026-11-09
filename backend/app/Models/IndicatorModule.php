<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class IndicatorModule extends Model
{
    use TracksChanges;

    protected $table = 'indicator_categories';

    protected $guarded = ['id'];

    public $timestamps = false;

    public function indicators() { return $this->hasMany(Indicator::class, 'module_id')->orderBy('sort'); }
}
