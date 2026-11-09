<?php

namespace App\Models;

use App\Models\Concerns\TracksChanges;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use TracksChanges;

    protected $table = 'documents';

    protected $guarded = ['id'];

    public function category() { return $this->belongsTo(DocumentCategory::class); }
    public function dependency() { return $this->belongsTo(Dependency::class); }
    public function versions() { return $this->hasMany(DocumentVersion::class)->orderByDesc('version_no'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function latestVersion() { return $this->hasOne(DocumentVersion::class)->ofMany('version_no', 'max'); }
}
