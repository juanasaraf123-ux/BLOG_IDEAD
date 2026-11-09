<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ChangeHistory;
use App\Models\DataSubmission;
use App\Models\Document;
use App\Models\Event;
use App\Models\Indicator;
use App\Models\MediaItem;
use App\Models\News;
use App\Models\Page;
use App\Services\FileStorage;
use App\Services\Settings;
use App\Support\Audit;
use Illuminate\Http\Request;

/** Carga de imágenes, auditoría, configuración y tablero del panel. */
class MiscController extends Controller
{
    /** Imágenes para contenidos (noticias, carrusel, CAT, proyectos, multimedia) en el disco público. */
    public function uploadImage(Request $request, FileStorage $files)
    {
        $u = $request->user();
        abort_unless(collect(['content.create', 'content.site', 'media.manage', 'cats.edit', 'projects.edit', 'settings.manage'])->contains(fn ($p) => $u->hasPermission($p)), 403);
        $request->validate(['file' => 'required|file']);
        $stored = $files->store($request->file('file'), 'image', 'public');

        return response()->json($stored, 201);
    }

    public function audit(Request $request)
    {
        abort_unless($request->user()->hasPermission('audit.view'), 403);
        $q = AuditLog::with('user:id,name,email')->orderByDesc('id');
        foreach (['action', 'user_id', 'entity_type'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }
        if ($request->filled('from')) {
            $q->where('created_at', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $q->where('created_at', '<=', $request->query('to').' 23:59:59');
        }

        return $q->paginate(50);
    }

    /** Historial de cambios de un registro. Se exige poder ver el tipo de entidad correspondiente. */
    public function history(Request $request, string $type, int $id)
    {
        $u = $request->user();
        $map = [
            'News' => 'content.create', 'Event' => 'content.create', 'Page' => 'content.create', 'MediaItem' => 'media.manage',
            'Cat' => 'cats.edit', 'Program' => 'programs.edit', 'Project' => 'projects.edit', 'Agreement' => 'agreements.view',
            'Indicator' => 'indicators.view_internal', 'DataSubmission' => 'indicators.view_internal', 'Document' => 'documents.view.internal',
            'User' => 'users.view', 'Role' => 'roles.manage', 'CatalogItem' => 'lists.edit', 'PettyCashExpense' => 'petty_cash.view',
        ];
        abort_unless(isset($map[$type]) && ($u->hasPermission($map[$type]) || $u->hasPermission('audit.view')), 403);

        return ChangeHistory::with('user:id,name')->where('entity_type', $type)->where('entity_id', $id)->orderByDesc('id')->limit(200)->get();
    }

    public function settings(Request $request)
    {
        abort_unless($request->user()->hasPermission('settings.manage'), 403);

        return Settings::all();
    }

    public function saveSettings(Request $request)
    {
        abort_unless($request->user()->hasPermission('settings.manage'), 403);
        $data = $request->validate([
            'site_name' => 'sometimes|string|max:255',
            'university_name' => 'sometimes|string|max:255',
            'contact_address' => 'sometimes|string|max:255',
            'contact_phone' => 'sometimes|string|max:120',
            'contact_email' => 'sometimes|string|max:255',
            'official_links' => 'sometimes|json',
            'social_links' => 'sometimes|json',
            'hero_title' => 'sometimes|string|max:255',
            'hero_text' => 'sometimes|string|max:1000',
            'logo_file_id' => 'sometimes|nullable|exists:files,id',
            'max_upload_mb' => 'sometimes|integer|between:1,100',
            'min_cell_size' => 'sometimes|integer|between:2,50',
            'mfa_enforced' => 'sometimes|boolean',
            'news_requires_review' => 'sometimes|boolean',
        ]);
        foreach ($data as $k => $v) {
            Settings::set($k, is_bool($v) ? ($v ? '1' : '0') : ($v === null ? null : (string) $v));
        }
        Audit::log('settings.updated', null, ['keys' => array_keys($data)]);

        return Settings::all();
    }

    /** Resumen de pendientes según los permisos del usuario. */
    public function dashboard(Request $request)
    {
        $u = $request->user();
        $out = ['pending' => []];
        if ($u->hasPermission('indicators.review')) {
            $out['pending']['lotes_por_revisar'] = DataSubmission::where('status', 'enviado')->count();
        }
        if ($u->hasPermission('indicators.publish')) {
            $out['pending']['lotes_por_publicar'] = DataSubmission::where('status', 'aprobado')->count();
        }
        if ($u->hasPermission('indicators.submit')) {
            $mine = DataSubmission::where('created_by', $u->id);
            $out['pending']['mis_lotes_devueltos'] = (clone $mine)->where('status', 'devuelto')->count();
            $out['pending']['mis_borradores'] = (clone $mine)->where('status', 'borrador')->count();
        }
        if ($u->hasPermission('content.publish')) {
            $out['pending']['contenidos_en_revision'] = News::where('status', 'en_revision')->count() + Event::where('status', 'en_revision')->count()
                + MediaItem::where('status', 'en_revision')->count() + Page::where('status', 'en_revision')->count();
        }
        if ($u->hasPermission('indicators.view_internal')) {
            $out['indicators'] = [
                'total' => Indicator::count(),
                'con_datos_publicados' => Indicator::whereHas('submissions', fn ($s) => $s->where('status', 'publicado'))->count(),
                'metodologia_validada' => Indicator::where('methodology_status', 'validada')->count(),
            ];
        }
        if (DocumentController::visibleLevels($u)) {
            $out['documents'] = Document::whereIn('confidentiality', DocumentController::visibleLevels($u))->count();
        }

        return $out;
    }
}
