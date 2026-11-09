<?php

namespace App\Models;

use App\Models\Concerns\SanitizesHtml;
use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Cat extends Model
{
    use TracksChanges, SanitizesHtml;

    protected $table = 'cats';

    protected $guarded = ['id'];

    protected array $htmlAttributes = ['history'];

    protected $casts = [
        'coords_verified' => 'boolean',
        'manager_public' => 'boolean',
        'is_demo' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
        'opened_on' => 'date:Y-m-d',
    ];

    public function municipality() { return $this->belongsTo(Municipality::class); }
    public function photo() { return $this->belongsTo(StoredFile::class, 'photo_file_id'); }
    public function sites() { return $this->hasMany(CatSite::class); }
    public function facilities() { return $this->hasMany(CatFacility::class); }
    public function events() { return $this->hasMany(CatEvent::class)->orderBy('event_date'); }
    public function coverage() { return $this->belongsToMany(Municipality::class, 'cat_municipality'); }
    public function offerings() { return $this->hasMany(ProgramOffering::class); }
    public function projects() { return $this->belongsToMany(Project::class); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
}
