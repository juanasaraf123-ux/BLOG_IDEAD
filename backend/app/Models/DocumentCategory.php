<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class DocumentCategory extends Model
{
    use TracksChanges;

    protected $table = 'document_categories';

    protected $guarded = ['id'];

    public $timestamps = false;

    public function documents() { return $this->hasMany(Document::class, 'category_id'); }
}
