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
        if ($u->hasPermission('indicators.submit') && ! $u->hasPermission('indicators.review')) {
            $out['pending']['solicitudes_abiertas'] = \App\Models\UpdateRequest::whereIn('dependency_id', $u->dependencyIds())->whereIn('status', ['abierta', 'en_proceso'])->count();
        }
        if ($u->hasPermission('indicators.review')) {
            $out['pending']['solicitudes_vencidas'] = \App\Models\UpdateRequest::whereIn('status', ['abierta', 'en_proceso'])->whereDate('due_date', '<', now())->count();
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

        // Cifras generales, gráficas y actividad reciente (solo agregados y contenidos institucionales, sin datos personales).
        $out['kpis'] = $this->dashboardKpis();
        $out['charts'] = $this->dashboardCharts();
        $out['recent'] = $this->recentActivity();

        return $out;
    }

    /** Variación porcentual solo cuando existe un valor anterior comparable (nunca se inventa una tendencia). */
    private static function change(?float $now, ?float $before): ?float
    {
        return ($now !== null && $before) ? round(($now - $before) / $before * 100, 1) : null;
    }

    private function studentsResult(): ?array
    {
        $i = Indicator::where('code', 'M02-I03')->first();

        return $i ? app(\App\Services\IndicatorQuery::class)->run($i, []) : null;
    }

    private function dashboardKpis(): array
    {
        $r = $this->studentsResult();
        $trend = collect($r['trend'] ?? [])->where('suppressed', false)->values();
        $last = $trend->last();
        $prev = $trend->count() > 1 ? $trend[$trend->count() - 2] : null;
        $year = (int) now()->year;
        $eventsNow = Event::whereYear('starts_at', $year)->count();
        $eventsBefore = Event::whereYear('starts_at', $year - 1)->count();

        return [
            'cats' => ['value' => \App\Models\Cat::where('status', '!=', 'inactivo')->count(), 'note' => 'Centros de Atención Tutorial activos'],
            'students' => ['value' => $last['value'] ?? null, 'note' => $last ? 'Período '.$last['period'] : 'Sin datos publicados', 'change' => self::change($last['value'] ?? null, $prev['value'] ?? null), 'versus' => $prev['period'] ?? null, 'is_demo' => (bool) ($r['is_demo'] ?? false)],
            'events' => ['value' => $eventsNow, 'note' => 'Programadas en '.$year, 'change' => self::change($eventsNow, $eventsBefore), 'versus' => (string) ($year - 1)],
            'projects' => ['value' => \App\Models\Project::count(), 'note' => \App\Models\Project::where('status', 'en_ejecucion')->count().' en ejecución'],
        ];
    }

    private function dashboardCharts(): array
    {
        $r = $this->studentsResult();
        if (! $r) {
            return ['enrollment' => [], 'by_cat' => [], 'period' => null, 'is_demo' => false];
        }
        $series = collect($r['trend'])->where('suppressed', false)->take(-6)->map(fn ($t) => ['period' => $t['period'], 'value' => $t['value']])->values();
        $parts = collect($r['breakdown'])->where('suppressed', false)->sortByDesc('value')->values();
        $top = $parts->take(5)->map(fn ($b) => ['label' => $b['label'], 'value' => $b['value']]);
        $rest = $parts->slice(5)->sum('value');
        if ($rest > 0) {
            $top->push(['label' => 'Otros CAT ('.($parts->count() - 5).')', 'value' => $rest]);
        }

        return ['enrollment' => $series, 'by_cat' => $top->values(), 'period' => $r['kpi']['period'] ?? null, 'is_demo' => (bool) $r['is_demo']];
    }

    private function recentActivity(): array
    {
        $types = ['News' => 'Noticia', 'Event' => 'Actividad', 'MediaItem' => 'Multimedia', 'Page' => 'Página', 'Cat' => 'CAT', 'Program' => 'Programa', 'Project' => 'Proyecto', 'HeroSlide' => 'Carrusel', 'DataSubmission' => 'Carga de indicador', 'Document' => 'Documento'];
        $verbs = ['created' => 'creó', 'updated' => 'actualizó', 'deleted' => 'eliminó'];

        return ChangeHistory::with('user:id,name')->whereIn('entity_type', array_keys($types))->latest('id')->limit(6)->get()->map(function ($h) use ($types, $verbs) {
            $c = $h->changes ?? [];
            $title = $c['title'] ?? $c['name'] ?? null;
            if (! $title) {
                $cls = 'App\\Models\\'.$h->entity_type;
                $m = class_exists($cls) ? $cls::find($h->entity_id) : null;
                $title = $m?->title ?? $m?->name ?? ($h->entity_type === 'DataSubmission' && $m ? optional($m->indicator)->code : null);
            }

            return [
                'id' => $h->id,
                'type' => $types[$h->entity_type],
                'entity' => $h->entity_type,
                'title' => $title ?? '#'.$h->entity_id,
                'action' => $verbs[$h->event] ?? $h->event,
                'user' => $h->user?->name ?? 'Carga inicial del sistema',
                'at' => $h->created_at?->toIso8601String(),
            ];
        })->all();
    }

    /**
     * Listas para los campos de selección de los formularios (CAT, programas, proyectos, indicadores…).
     * Solo datos no sensibles (identificador y nombre), para cualquier funcionario con sesión:
     * así un rol puede asociar una noticia a un CAT aunque no pueda editar las fichas de los CAT.
     */
    public function options(Request $request, string $type)
    {
        $map = [
            'cats' => [\App\Models\Cat::class, ['id', 'name', 'slug'], 'name'],
            'programs' => [\App\Models\Program::class, ['id', 'name', 'slug', 'snies_code'], 'name'],
            'projects' => [\App\Models\Project::class, ['id', 'name', 'code'], 'name'],
            'indicators' => [\App\Models\Indicator::class, ['id', 'code', 'name'], 'code'],
            'dependencies' => [\App\Models\Dependency::class, ['id', 'code', 'name'], 'name'],
            'periods' => [\App\Models\AcademicPeriod::class, ['id', 'code', 'year', 'term', 'type'], 'code'],
            'news-categories' => [\App\Models\NewsCategory::class, ['id', 'name'], 'name'],
            'education-levels' => [\App\Models\EducationLevel::class, ['id', 'name', 'code'], 'sort'],
            'knowledge-areas' => [\App\Models\KnowledgeArea::class, ['id', 'name'], 'name'],
            'departments' => [\App\Models\Department::class, ['id', 'code', 'name'], 'name'],
            'document-categories' => [\App\Models\DocumentCategory::class, ['id', 'code', 'name'], 'name'],
        ];
        abort_unless(isset($map[$type]), 404);
        [$model, $cols, $order] = $map[$type];

        return ['data' => $model::query()->orderBy($order)->get($cols)];
    }
}
