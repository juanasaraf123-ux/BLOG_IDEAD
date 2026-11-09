<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Publication extends Model
{
    use TracksChanges;

    protected $table = 'publications';

    protected $guarded = ['id'];

    protected $casts = [
        'is_demo' => 'boolean',
    ];

    public function program() { return $this->belongsTo(Program::class); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function researchGroup() { return $this->belongsTo(CatalogItem::class, 'research_group_id'); }
    public function document() { return $this->belongsTo(Document::class); }
}
