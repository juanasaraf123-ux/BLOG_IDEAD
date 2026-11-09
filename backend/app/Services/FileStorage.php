<?php

namespace App\Services;

use App\Models\StoredFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Almacenamiento seguro de archivos.
 *
 * - Lista blanca de extensiones Y tipos MIME reales (detectados con fileinfo, no los declarados por el cliente).
 * - Bloqueo de ejecutables, scripts, SVG (vector XSS) y dobles extensiones peligrosas.
 * - Nombre aleatorio en disco; el nombre original solo se guarda como metadato.
 * - Disco `public` (imágenes de contenidos publicados) separado del disco `private`
 *   (documentos), que está fuera del docroot y solo se descarga vía API autorizada.
 */
class FileStorage
{
    public const KINDS = [
        'image' => [
            'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'], 'webp' => ['image/webp'],
        ],
        'document' => [
            'pdf' => ['application/pdf'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
            'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
            'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
            'odt' => ['application/vnd.oasis.opendocument.text', 'application/zip'],
            'ods' => ['application/vnd.oasis.opendocument.spreadsheet', 'application/zip'],
            'csv' => ['text/csv', 'text/plain', 'application/csv'],
            'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'],
        ],
        'data' => [
            'csv' => ['text/csv', 'text/plain', 'application/csv'],
            'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
        ],
    ];

    private const FORBIDDEN_FRAGMENTS = ['.php', '.phtml', '.phar', '.exe', '.sh', '.bat', '.cmd', '.js', '.html', '.htm', '.svg', '.jar', '.msi', '.com', '.scr', '.ps1', '.vbs', '.htaccess'];

    public function store(UploadedFile $file, string $kind, string $disk): StoredFile
    {
        $this->validate($file, $kind);

        $ext = strtolower($file->getClientOriginalExtension());
        $dir = $kind.'/'.now()->format('Y/m');
        $name = Str::random(40).'.'.$ext;
        $path = $file->storeAs($dir, $name, ['disk' => $disk]);

        return StoredFile::create([
            'disk' => $disk,
            'path' => $path,
            'original_name' => mb_substr(basename($file->getClientOriginalName()), 0, 200),
            'mime' => $this->realMime($file),
            'size_bytes' => $file->getSize(),
            'sha256' => hash_file('sha256', $file->getRealPath()),
            'uploaded_by' => Auth::id(),
        ]);
    }

    public function validate(UploadedFile $file, string $kind): void
    {
        $fail = fn (string $m) => throw ValidationException::withMessages(['file' => $m]);

        if (! $file->isValid()) {
            $fail('La carga del archivo falló.');
        }
        $maxBytes = (int) Settings::get('max_upload_mb', 20) * 1024 * 1024;
        if ($file->getSize() > $maxBytes) {
            $fail('El archivo supera el tamaño máximo permitido ('.Settings::get('max_upload_mb').' MB).');
        }
        $original = strtolower($file->getClientOriginalName());
        foreach (self::FORBIDDEN_FRAGMENTS as $frag) {
            if (str_contains($original, $frag.'.') || str_ends_with($original, $frag)) {
                $fail('Tipo de archivo no permitido.');
            }
        }
        $ext = strtolower($file->getClientOriginalExtension());
        $allowed = self::KINDS[$kind] ?? [];
        if (! isset($allowed[$ext])) {
            $fail('Extensión no permitida. Permitidas: '.implode(', ', array_keys($allowed)).'.');
        }
        $mime = $this->realMime($file);
        if (! in_array($mime, $allowed[$ext], true)) {
            $fail('El contenido del archivo no corresponde a su extensión.');
        }
        if ($kind === 'image' && @getimagesize($file->getRealPath()) === false) {
            $fail('La imagen no es válida.');
        }
    }

    private function realMime(UploadedFile $file): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);

        return (string) $finfo->file($file->getRealPath());
    }

    public function absolutePath(StoredFile $file): string
    {
        return Storage::disk($file->disk)->path($file->path);
    }

    public function delete(StoredFile $file): void
    {
        Storage::disk($file->disk)->delete($file->path);
        $file->delete();
    }
}
