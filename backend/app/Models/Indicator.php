<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Indicator extends Model
{
    use TracksChanges;

    protected $table = 'indicators';

    protected $guarded = ['id'];

    protected $casts = [
        'allowed_dimensions' => 'array',
        'is_active' => 'boolean',
        'publication_authorized' => 'boolean',
    ];

    public function module() { return $this->belongsTo(IndicatorModule::class, 'module_id'); }
    public function sources() { return $this->belongsToMany(DataSource::class); }
    public function classifier() { return $this->belongsTo(Classifier::class); }
    public function responsibleDependency() { return $this->belongsTo(Dependency::class, 'responsible_dependency_id'); }
    public function submissions() { return $this->hasMany(DataSubmission::class); }

    /** ¿Puede mostrarse en el portal público? (los AGR_S requieren autorización expresa). */
    public function isPublishable(): bool
    {
        return $this->is_active && $this->publication_authorized;
    }
}
