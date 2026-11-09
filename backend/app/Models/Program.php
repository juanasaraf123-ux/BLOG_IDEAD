<?php

namespace App\Models;

use App\Models\Concerns\SanitizesHtml;
use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use TracksChanges, SanitizesHtml;

    protected $table = 'programs';

    protected $guarded = ['id'];

    protected array $htmlAttributes = ['description'];

    protected $casts = [
        'is_demo' => 'boolean',
        'qualified_registry_until' => 'date',
        'accreditation_until' => 'date',
    ];

    public function level() { return $this->belongsTo(EducationLevel::class, 'level_id'); }
    public function area() { return $this->belongsTo(KnowledgeArea::class, 'area_id'); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function offerings() { return $this->hasMany(ProgramOffering::class); }
}
