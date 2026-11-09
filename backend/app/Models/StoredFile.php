<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoredFile extends Model
{
    protected $table = 'files';

    protected $guarded = ['id'];

    protected $hidden = ['path'];
    protected $appends = ['url'];
    /** URL pública directa solo para archivos del disco público; los privados se descargan por la API autorizada. */
    public function getUrlAttribute(): ?string
    {
        return $this->disk === 'public' ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->path) : null;
    }
}
