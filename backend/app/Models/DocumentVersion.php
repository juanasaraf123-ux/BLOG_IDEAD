<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentVersion extends Model
{
    protected $table = 'document_versions';

    protected $guarded = ['id'];

    public function file() { return $this->belongsTo(StoredFile::class, 'file_id'); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
}
