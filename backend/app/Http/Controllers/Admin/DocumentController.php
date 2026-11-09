<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\DocumentVersion;
use App\Models\User;
use App\Services\FileStorage;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Gestión documental con control de versiones.
 * Todos los documentos se guardan en el disco privado (fuera del docroot); ningún archivo tiene enlace directo.
 * La visibilidad depende de la confidencialidad y de los permisos del usuario:
 *   publico → cualquier usuario con acceso a documentos | interno → documents.view.internal
 *   restringido → documents.view.restricted | financiero → documents.view.financial
 */
class DocumentController extends Controller
{
    public const LEVELS = ['publico' => null, 'interno' => 'documents.view.internal', 'restringido' => 'documents.view.restricted', 'financiero' => 'documents.view.financial'];

    public static function visibleLevels(User $u): array
    {
        $levels = [];
        foreach (self::LEVELS as $level => $perm) {
            if ($perm === null ? self::hasAnyDocPermission($u) : $u->hasPermission($perm)) {
                $levels[] = $level;
            }
        }

        return $levels;
    }

    private static function hasAnyDocPermission(User $u): bool
    {
        foreach (['documents.view.internal', 'documents.view.restricted', 'documents.view.financial', 'documents.upload', 'documents.edit'] as $p) {
            if ($u->hasPermission($p)) {
                return true;
            }
        }

        return false;
    }

    private function query(Request $request)
    {
        $u = $request->user();
        $q = Document::query()->with(['category:id,code,name', 'dependency:id,code', 'latestVersion.file', 'creator:id,name'])
            ->whereIn('confidentiality', self::visibleLevels($u));
        if (! $u->hasPermission('scope.all_dependencies')) {
            $q->where(fn ($w) => $w->whereIn('dependency_id', $u->dependencyIds())->orWhereNull('dependency_id')->orWhere('confidentiality', 'publico'));
        }

        return $q;
    }

    public function index(Request $request)
    {
        abort_unless(self::visibleLevels($request->user()), 403);
        $q = $this->query($request)->orderByDesc('updated_at');
        foreach (['category_id', 'dependency_id', 'confidentiality', 'status', 'related_type', 'related_id'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }
        if ($t = $request->query('q')) {
            $q->where(fn ($w) => $w->where('title', 'like', "%$t%")->orWhere('description', 'like', "%$t%"));
        }

        return $q->paginate(min((int) $request->query('per_page', 25), 100));
    }

    public function show(Request $request, int $id)
    {
        abort_unless(self::visibleLevels($request->user()), 403);

        return $this->query($request)->with('versions.file', 'versions.uploader:id,name')->findOrFail($id);
    }

    private function authorizeWrite(Request $request, string $confidentiality, ?int $dependencyId): void
    {
        $u = $request->user();
        abort_unless($u->hasPermission('documents.upload') || $u->hasPermission('documents.edit'), 403);
        abort_unless(in_array($confidentiality, self::visibleLevels($u), true), 403, 'No puede gestionar documentos con esta confidencialidad.');
        if ($dependencyId) {
            abort_unless($u->inScope($dependencyId), 403, 'Dependencia fuera de su alcance.');
        }
    }

    public function store(Request $request, FileStorage $files)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'category_id' => 'required|exists:document_categories,id',
            'dependency_id' => 'nullable|exists:dependencies,id',
            'confidentiality' => 'nullable|in:publico,interno,restringido,financiero',
            'status' => 'nullable|in:borrador,vigente,archivado',
            'related_type' => 'nullable|in:project,agreement,cat,submission,petty_cash',
            'related_id' => 'nullable|integer',
            'file' => 'required|file',
        ]);
        $data['confidentiality'] ??= DocumentCategory::find($data['category_id'])->default_confidentiality;
        $this->authorizeWrite($request, $data['confidentiality'], $data['dependency_id'] ?? null);
        $doc = DB::transaction(function () use ($request, $data, $files) {
            $stored = $files->store($request->file('file'), 'document', 'local');
            $doc = Document::create(collect($data)->except('file')->all() + ['created_by' => $request->user()->id, 'status' => $data['status'] ?? 'vigente', 'current_version' => 1]);
            DocumentVersion::create(['document_id' => $doc->id, 'version_no' => 1, 'file_id' => $stored->id, 'change_note' => 'Versión inicial', 'uploaded_by' => $request->user()->id]);

            return $doc;
        });
        Audit::log('document.uploaded', $doc, ['confidentiality' => $doc->confidentiality]);

        return response()->json($this->show($request, $doc->id), 201);
    }

    public function update(Request $request, int $id)
    {
        $doc = $this->query($request)->findOrFail($id);
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'category_id' => 'required|exists:document_categories,id',
            'dependency_id' => 'nullable|exists:dependencies,id',
            'confidentiality' => 'required|in:publico,interno,restringido,financiero',
            'status' => 'required|in:borrador,vigente,archivado',
            'related_type' => 'nullable|in:project,agreement,cat,submission,petty_cash',
            'related_id' => 'nullable|integer',
        ]);
        $this->authorizeWrite($request, $doc->confidentiality, $doc->dependency_id);
        $this->authorizeWrite($request, $data['confidentiality'], $data['dependency_id'] ?? null);
        if ($data['confidentiality'] !== $doc->confidentiality || $data['category_id'] != $doc->category_id) {
            abort_unless($request->user()->hasPermission('documents.classify'), 403, 'Reclasificar documentos requiere el permiso de clasificación documental.');
        }
        if ($data['status'] === 'archivado' && $doc->status !== 'archivado') {
            abort_unless($request->user()->hasPermission('documents.archive'), 403);
        }
        $doc->update($data);
        if ($doc->wasChanged('confidentiality')) {
            Audit::log('document.reclassified', $doc, ['from' => $doc->getOriginal('confidentiality'), 'to' => $doc->confidentiality]);
        }

        return $this->show($request, $id);
    }

    public function newVersion(Request $request, int $id, FileStorage $files)
    {
        $doc = $this->query($request)->findOrFail($id);
        $this->authorizeWrite($request, $doc->confidentiality, $doc->dependency_id);
        $data = $request->validate(['file' => 'required|file', 'change_note' => 'required|string|max:255']);
        DB::transaction(function () use ($request, $doc, $data, $files) {
            $stored = $files->store($request->file('file'), 'document', 'local');
            $next = $doc->current_version + 1;
            DocumentVersion::create(['document_id' => $doc->id, 'version_no' => $next, 'file_id' => $stored->id, 'change_note' => $data['change_note'], 'uploaded_by' => $request->user()->id]);
            $doc->update(['current_version' => $next]);
        });
        Audit::log('document.version_added', $doc, ['version' => $doc->current_version]);

        return $this->show($request, $id);
    }

    public function download(Request $request, int $id, ?int $version = null)
    {
        $doc = $this->query($request)->findOrFail($id);
        $v = $version ? $doc->versions()->where('version_no', $version)->firstOrFail() : $doc->latestVersion;
        $file = $v->file;
        Audit::log('document.download', $doc, ['version' => $v->version_no, 'confidentiality' => $doc->confidentiality]);

        return Storage::disk($file->disk)->download($file->path, $file->original_name, [
            'Content-Type' => $file->mime,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
