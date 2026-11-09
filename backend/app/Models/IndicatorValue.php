<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndicatorValue extends Model
{
    protected $table = 'indicator_values';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'is_suppressed' => 'boolean',
        'value' => 'float',
    ];

    public const DIMENSIONS = ['program_id', 'cat_id', 'department_id', 'municipality_id', 'level_id', 'area_id', 'classifier_item_id'];

    public function submission() { return $this->belongsTo(DataSubmission::class, 'submission_id'); }
    public function period() { return $this->belongsTo(AcademicPeriod::class, 'period_id'); }
    public function program() { return $this->belongsTo(Program::class); }
    public function cat() { return $this->belongsTo(Cat::class); }
    public function department() { return $this->belongsTo(Department::class); }
    public function municipality() { return $this->belongsTo(Municipality::class); }
    public function level() { return $this->belongsTo(EducationLevel::class, 'level_id'); }
    public function area() { return $this->belongsTo(KnowledgeArea::class, 'area_id'); }
    public function classifierItem() { return $this->belongsTo(ClassifierItem::class); }

    public static function hashDims(array $row): string
    {
        $parts = [$row['period_id'] ?? ''];
        foreach (self::DIMENSIONS as $d) {
            $parts[] = $row[$d] ?? '';
        }

        return hash('sha256', implode('|', $parts));
    }
}
