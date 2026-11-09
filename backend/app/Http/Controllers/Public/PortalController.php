<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Agreement;
use App\Models\Cat;
use App\Models\CatalogItem;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\EducationLevel;
use App\Models\Event;
use App\Models\HeroSlide;
use App\Models\HomeHighlight;
use App\Models\Indicator;
use App\Models\IndicatorModule;
use App\Models\KnowledgeArea;
use App\Models\MediaItem;
use App\Models\News;
use App\Models\NewsCategory;
use App\Models\Page;
use App\Models\Program;
use App\Models\ProgramOffering;
use App\Models\Project;
use App\Models\StoredFile;
use App\Models\TeamUnit;
use App\Services\IndicatorQuery;
use App\Services\Settings;
use App\Support\PublicCache;
use App\Support\TableExporter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * API pública de solo lectura. Únicamente devuelve contenido publicado y datos autorizados:
 * nunca documentos no públicos, lotes sin publicar, ni datos de demostración en producción.
 */
class PortalController extends Controller
{
    private IndicatorQuery $query;

    public function __construct()
    {
        $this->query = new IndicatorQuery(internal: false);
    }

    // ------------------------------------------------------------------ helpers

    private function demo(Builder $q): Builder
    {
        return config('idead.demo_data') ? $q : $q->where($q->getModel()->getTable().'.is_demo', false);
    }

    private function published(Builder $q): Builder
    {
        return $this->demo($q)->where('status', 'publicado')->where(fn ($w) => $w->whereNull('publish_at')->orWhere('publish_at', '<=', now()));
    }

    private function publishedEntity(Builder $q): Builder
    {
        return $this->demo($q)->where('publication_status', 'publicado');
    }

    private function filters(Request $r): array
    {
        return $r->only(['period', 'year', 'program', 'cat', 'department', 'municipality', 'level', 'area', 'classifier']);
    }

    private function indicatorMeta(Indicator $i): array
    {
        return [
            'code' => $i->code,
            'name' => $i->name,
            'description' => $i->description ?: $i->information_required,
            'information_required' => $i->information_required,
            'unit' => $i->unit,
            'value_type' => $i->value_type,
            'periodicity' => $i->periodicity,
            'chart_type' => $i->chart_type,
            'group_by' => $i->group_by,
            'allowed_dimensions' => $i->allowed_dimensions ?? [],
            'widget' => $i->widget,
            'publication_level' => $i->publication_level,
            'publication_authorized' => $i->isPublishable(),
            'methodology' => $i->methodology_status === 'validada' ? $i->methodology : null,
            'methodology_status' => $i->methodology_status,
            'source' => $i->source_text,
            'sources' => $i->sources->map(fn ($s) => ['code' => $s->code, 'name' => $s->name, 'validated' => $s->official_name_status === 'validado']),
            'responsible' => $i->responsibleDependency?->name,
            'observations' => $i->observations,
            'suggested_visualization' => $i->suggested_visualization,
            'classifier' => $i->classifier?->name,
        ];
    }

    private function kpiFor(string $code, array $filters = []): ?array
    {
        $i = Indicator::where('code', $code)->first();
        if (! $i || ! $i->isPublishable()) {
            return null;
        }
        $r = $this->query->run($i, $filters);

        return $r['kpi'] ? $r['kpi'] + ['is_demo' => $r['is_demo']] : null;
    }

    private function fileUrl(?int $fileId): ?string
    {
        if (! $fileId) {
            return null;
        }
        $f = StoredFile::find($fileId);

        return $f && $f->disk === 'public' ? Storage::disk('public')->url($f->path) : null;
    }

    // ------------------------------------------------------------------ sitio e inicio

    public function site(Request $request)
    {
        return PublicCache::remember('site', function () use ($request) {
            $settings = Settings::publicValues();
            $settings['logo_url'] = $this->fileUrl(isset($settings['logo_file_id']) ? (int) $settings['logo_file_id'] : null);
            unset($settings['logo_file_id']);
            foreach (['official_links', 'social_links'] as $k) {
                $settings[$k] = json_decode($settings[$k] ?? '[]', true) ?: [];
            }
    
            return [
                'settings' => $settings,
                'demo_mode' => (bool) config('idead.demo_data'),
                'modules' => IndicatorModule::orderBy('number')->get(['number', 'slug', 'name', 'icon', 'description']),
                'pages' => Page::where('status', 'publicado')->get(['slug', 'title']),
            ];
        });
    }

    public function home(Request $request)
    {
        return PublicCache::remember('home', function () use ($request) {
            $highlights = HomeHighlight::with('indicator.sources')->where('is_active', true)->orderBy('sort')->get()->map(function ($h) {
                $value = null;
                $period = null;
                $source = null;
                $isDemo = false;
                switch ($h->metric_type) {
                    case 'indicator':
                        if ($h->indicator) {
                            $k = $this->kpiFor($h->indicator->code, $h->classifier_item_id ? ['classifier' => $h->classifier_item_id] : []);
                            $value = $k['value'] ?? null;
                            $period = $k['period'] ?? null;
                            $isDemo = $k['is_demo'] ?? false;
                            $source = $h->indicator->source_text;
                        }
                        break;
                    case 'events_year':
                        $q = $this->published(Event::query())->whereYear('starts_at', now()->year);
                        $value = $q->count();
                        $isDemo = (clone $q)->where('is_demo', true)->exists();
                        $period = (string) now()->year;
                        $source = 'Agenda institucional publicada en el portal';
                        break;
                    case 'cats_count':
                        $q = $this->publishedEntity(Cat::query())->where('status', '!=', 'inactivo');
                        $value = $q->count();
                        $isDemo = (clone $q)->where('is_demo', true)->exists();
                        $source = 'Registro de CAT publicado (CRIDEAD)';
                        break;
                    case 'programs_count':
                        $q = $this->publishedEntity(Program::query())->where('status', 'activo');
                        $value = $q->count();
                        $isDemo = (clone $q)->where('is_demo', true)->exists();
                        $source = 'Catálogo de programas publicado';
                        break;
                }
                if ($value === 0 && $h->metric_type !== 'indicator') {
                    $value = null; // sin registros publicados → pendiente
                }
    
                return [
                    'label' => $h->label, 'icon' => $h->icon, 'value' => $value, 'period' => $period, 'source' => $source,
                    'indicator_code' => $h->indicator?->code, 'link' => $h->link, 'is_demo' => $isDemo,
                ];
            });
    
            $slides = $this->demo(HeroSlide::query())->with('image')->where('is_active', true)
                ->where(fn ($w) => $w->whereNull('starts_on')->orWhere('starts_on', '<=', now()->toDateString()))
                ->where(fn ($w) => $w->whereNull('ends_on')->orWhere('ends_on', '>=', now()->toDateString()))
                ->orderBy('sort')->get()->map(fn ($s) => [
                    'title' => $s->title, 'subtitle' => $s->subtitle, 'image_url' => $s->image?->url, 'link_url' => $s->link_url, 'is_demo' => $s->is_demo,
                ]);
    
            return [
                'highlights' => $highlights,
                'slides' => $slides,
                'news' => $this->newsQuery()->orderByDesc('is_featured')->orderByDesc('publish_at')->limit(3)->get()->map(fn ($n) => $this->newsCard($n)),
                'events' => $this->published(Event::query())->with('cat:id,name')->where('starts_at', '>=', now()->startOfDay())->orderBy('starts_at')->limit(3)->get()->map(fn ($e) => $this->eventCard($e)),
                'team' => TeamUnit::where('is_active', true)->orderBy('sort')->get(),
                'cats' => $this->catSummaries(),
            ];
        });
    }

    private function catSummaries()
    {
        $latestPeriod = ProgramOffering::query()->join('academic_periods', 'academic_periods.id', '=', 'program_offerings.period_id')
            ->orderByDesc('academic_periods.year')->orderByDesc('academic_periods.term')->value('period_id');

        return $this->publishedEntity(Cat::query())->with('municipality.department')->withCount('coverage')->orderBy('name')->get()->map(fn ($c) => [
            'slug' => $c->slug,
            'name' => $c->name,
            'status' => $c->status,
            'municipality' => $c->municipality->name,
            'department' => $c->municipality->department->name,
            'department_code' => $c->municipality->department->code,
            'latitude' => $c->coords_verified ? $c->latitude : null,
            'longitude' => $c->coords_verified ? $c->longitude : null,
            'is_demo' => $c->is_demo,
            'summary' => [
                'students' => $this->kpiFor('M02-I03', ['cat' => $c->id]),
                'teachers' => $this->kpiFor('M04-I03', ['cat' => $c->id]),
                'municipalities' => $c->coverage_count ?: null,
                'programs' => $latestPeriod ? (ProgramOffering::where('cat_id', $c->id)->where('period_id', $latestPeriod)->distinct('program_id')->count('program_id') ?: null) : null,
            ],
        ]);
    }

    // ------------------------------------------------------------------ indicadores

    public function modules()
    {
        return IndicatorModule::withCount('indicators')->orderBy('number')->get();
    }

    public function module(Request $request, string $slug)
    {
        return PublicCache::remember('module.'.$slug, function () use ($request, $slug) {
            $m = IndicatorModule::where('slug', $slug)->firstOrFail();
            $indicators = Indicator::with(['sources', 'responsibleDependency', 'classifier'])->where('module_id', $m->id)->where('is_active', true)->orderBy('sort')->get();
    
            return ['module' => $m, 'indicators' => $indicators->map(fn ($i) => $this->indicatorMeta($i))];
        });
    }

    public function indicatorData(Request $request, string $code)
    {
        return PublicCache::remember('ind.'.$code.'.'.md5(json_encode($this->filters($request))), function () use ($request, $code) {
            $i = Indicator::with(['sources', 'responsibleDependency', 'classifier'])->where('code', $code)->where('is_active', true)->firstOrFail();
            $meta = $this->indicatorMeta($i);
            if (! $i->isPublishable()) {
                return ['indicator' => $meta, 'data' => null, 'status' => 'pendiente_autorizacion'];
            }
            $data = $this->query->run($i, $this->filters($request));
    
            return ['indicator' => $meta, 'data' => $data, 'status' => $data['row_count'] ? 'publicado' : 'pendiente'];
        });
    }

    public function indicatorExport(Request $request, string $code)
    {
        $i = Indicator::where('code', $code)->where('is_active', true)->firstOrFail();
        abort_unless($i->isPublishable(), 404);
        $res = $this->query->run($i, $this->filters($request));

        return TableExporter::download('indicador_'.$i->code, TableExporter::INDICATOR_HEADER, TableExporter::indicatorRows($i->code, $i->name, $i->unit, $res), (string) $request->query('format', 'csv'), [
            ['Portal IDEAD — Universidad del Tolima'],
            ['Indicador', $i->code.' '.$i->name],
            ['Fuente', $i->source_text],
            ['Metodología', $i->methodology_status === 'validada' ? $i->methodology : 'Pendiente de validación institucional'],
            ['Generado', now()->format('Y-m-d H:i')],
        ] + ($res['is_demo'] ? [5 => ['ADVERTENCIA', 'DATOS DE DEMOSTRACIÓN — NO SON CIFRAS OFICIALES']] : []));
    }

    public function filterOptions(Request $request)
    {
        return PublicCache::remember('filters', function () use ($request) {
            return [
                'periods' => AcademicPeriod::orderByDesc('year')->orderByDesc('term')->get(['id', 'code', 'year', 'term', 'type']),
                'years' => AcademicPeriod::distinct()->orderByDesc('year')->pluck('year'),
                'programs' => $this->publishedEntity(Program::query())->orderBy('name')->get(['id', 'name', 'level_id', 'slug']),
                'cats' => $this->publishedEntity(Cat::query())->with('municipality:id,department_id')->orderBy('name')->get(['id', 'name', 'slug', 'municipality_id'])
                    ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'department_id' => $c->municipality?->department_id]),
                'departments' => Department::orderBy('name')->get(['id', 'code', 'name']),
                'levels' => EducationLevel::orderBy('sort')->get(['id', 'code', 'name', 'cycle']),
                'areas' => KnowledgeArea::orderBy('name')->get(['id', 'code', 'name']),
            ];
        });
    }

    public function transparency(Request $request)
    {
        return PublicCache::remember('transparency', function () use ($request) {
            return [
                'modules' => IndicatorModule::orderBy('number')->get()->map(fn ($m) => [
                    'number' => $m->number, 'slug' => $m->slug, 'name' => $m->name,
                    'indicators' => Indicator::with(['sources', 'responsibleDependency', 'classifier'])->where('module_id', $m->id)->orderBy('sort')->get()
                        ->map(fn ($i) => $this->indicatorMeta($i) + [
                            'last_published_at' => $i->submissions()->where('status', 'publicado')->when(! config('idead.demo_data'), fn ($q) => $q->where('is_demo', false))->max('published_at'),
                        ]),
                ]),
                'documents' => $this->publicDocuments()->limit(50)->get()->map(fn ($d) => $this->documentCard($d)),
                'agreements' => $this->demo(Agreement::query())->where('is_public', true)->orderByDesc('start_date')->limit(50)->get(['id', 'number', 'counterpart', 'object', 'start_date', 'end_date', 'status', 'contributed_amount', 'is_demo']),
            ];
        });
    }

    public function lists(Request $request, string $type)
    {
        $q = $this->publishedEntity(CatalogItem::query())->with('cat:id,name,slug', 'program:id,name,slug')->where('list_type', $type);
        foreach (['cat_id', 'program_id', 'year'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }

        return $q->orderByDesc('year')->orderBy('title')->limit(500)->get();
    }

    // ------------------------------------------------------------------ CAT y programas

    public function cats(Request $request)
    {
        return PublicCache::remember('cats.'.md5(json_encode($request->query())), function () use ($request) {
            $list = $this->catSummaries();
            if ($request->filled('department')) {
                $list = $list->where('department_code', $request->query('department'))->values();
            }
            if ($request->query('with') === 'details') {
                $details = $this->publishedEntity(Cat::query())->with(['sites' => fn ($q) => $q->where('is_active', true), 'facilities', 'events'])->get()->keyBy('slug');
                $list = $list->map(fn ($c) => $c + [
                    'sites' => $details[$c['slug']]->sites->map->only(['name', 'ownership', 'address'])->values(),
                    'facilities' => $details[$c['slug']]->facilities->map->only(['facility_type', 'quantity', 'capacity'])->values(),
                    'events' => $details[$c['slug']]->events->map(fn ($e) => ['event_type' => $e->event_type, 'event_date' => $e->event_date?->toDateString(), 'description' => $e->description])->values(),
                ])->values();
            }
    
            return $list;
        });
    }

    public function agreements(Request $request)
    {
        $q = $this->demo(Agreement::query())->where('is_public', true)->orderByDesc('start_date');
        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }

        return $q->get(['id', 'number', 'counterpart', 'object', 'start_date', 'end_date', 'status', 'contributed_amount', 'is_demo']);
    }

    public function cat(string $slug)
    {
        $c = $this->publishedEntity(Cat::query())->with(['municipality.department', 'photo', 'sites' => fn ($q) => $q->where('is_active', true), 'facilities', 'events', 'coverage.department'])->where('slug', $slug)->firstOrFail();
        $data = $c->toArray();
        if (! $c->manager_public) {
            $data['manager_name'] = null;
        }
        if (! $c->coords_verified) {
            $data['latitude'] = $data['longitude'] = null;
        }
        unset($data['dependency_id']);
        $data['photo_url'] = $c->photo?->url;

        $latest = ProgramOffering::where('cat_id', $c->id)->join('academic_periods', 'academic_periods.id', '=', 'program_offerings.period_id')
            ->orderByDesc('academic_periods.year')->orderByDesc('academic_periods.term')->value('period_id');
        $data['offerings'] = $latest ? ProgramOffering::with(['program.level', 'period'])->where('cat_id', $c->id)->where('period_id', $latest)
            ->whereHas('program', fn ($p) => $this->publishedEntity($p))->get()
            ->map(fn ($o) => ['program' => $o->program->name, 'slug' => $o->program->slug, 'level' => $o->program->level->name, 'admits_new' => $o->admits_new, 'approved_quota' => $o->approved_quota, 'period' => $o->period->code]) : [];

        // Cifras integradas (M07-I07): reutiliza los valores publicados por CAT de todos los indicadores que admiten esa desagregación.
        $figures = [];
        foreach (Indicator::with('module')->where('is_active', true)->get() as $i) {
            if (! in_array('cat', $i->allowed_dimensions ?? [], true) || ! $i->isPublishable()) {
                continue;
            }
            $r = $this->query->run($i, ['cat' => $c->id]);
            if ($r['kpi']) {
                $figures[] = ['code' => $i->code, 'name' => $i->name, 'module' => $i->module->name, 'module_slug' => $i->module->slug, 'unit' => $i->unit, 'value_type' => $i->value_type] + $r['kpi'] + ['is_demo' => $r['is_demo']];
            }
        }
        $data['figures'] = $figures;
        $data['projects'] = $this->publishedEntity(Project::query())->whereHas('cats', fn ($q) => $q->where('cats.id', $c->id))->get(['id', 'slug', 'name', 'status', 'progress_pct', 'is_demo']);
        $data['news'] = $this->newsQuery()->where('cat_id', $c->id)->orderByDesc('publish_at')->limit(4)->get()->map(fn ($n) => $this->newsCard($n));
        $data['activities'] = $this->published(Event::query())->where('cat_id', $c->id)->where('starts_at', '>=', now()->startOfDay())->orderBy('starts_at')->limit(4)->get()->map(fn ($e) => $this->eventCard($e));
        $data['media'] = $this->published(MediaItem::query())->with('file')->where('cat_id', $c->id)->latest('publish_at')->limit(8)->get()->map(fn ($m) => $this->mediaCard($m));

        return $data;
    }

    public function programs(Request $request)
    {
        $q = $this->publishedEntity(Program::query())->with(['level', 'area'])->orderBy('name');
        foreach (['level_id', 'area_id', 'status'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }
        if ($request->filled('cat')) {
            $q->whereHas('offerings', fn ($o) => $o->where('cat_id', $request->query('cat')));
        }

        return $q->get()->map(fn ($p) => $p->only(['id', 'slug', 'name', 'snies_code', 'modality', 'duration_semesters', 'credits', 'status', 'qualified_registry_until', 'accreditation_until', 'is_demo']) + [
            'level' => $p->level?->name, 'cycle' => $p->level?->cycle, 'area' => $p->area?->name,
            'cats_count' => $p->offerings()->distinct('cat_id')->count('cat_id'),
        ]);
    }

    public function program(string $slug)
    {
        $p = $this->publishedEntity(Program::query())->with(['level', 'area'])->where('slug', $slug)->firstOrFail();
        $data = $p->toArray();
        unset($data['dependency_id']);
        $data['offerings'] = ProgramOffering::with(['cat.municipality.department', 'period'])->where('program_id', $p->id)
            ->whereHas('cat', fn ($c) => $this->publishedEntity($c))->get()
            ->sortByDesc(fn ($o) => $o->period->year * 10 + $o->period->term)->values()
            ->map(fn ($o) => ['cat' => $o->cat->name, 'cat_slug' => $o->cat->slug, 'department' => $o->cat->municipality->department->name, 'period' => $o->period->code, 'admits_new' => $o->admits_new, 'approved_quota' => $o->approved_quota]);

        return $data;
    }

    public function offerings(Request $request)
    {
        $q = ProgramOffering::with(['program.level', 'cat.municipality.department', 'period'])
            ->whereHas('program', fn ($p) => $this->publishedEntity($p))->whereHas('cat', fn ($c) => $this->publishedEntity($c));
        if (! config('idead.demo_data')) {
            $q->where('is_demo', false);
        }
        foreach (['cat_id' => 'cat', 'program_id' => 'program'] as $col => $param) {
            if ($request->filled($param)) {
                $q->where($col, $request->query($param));
            }
        }
        if ($request->filled('period')) {
            $q->whereHas('period', fn ($p) => $p->where('code', $request->query('period'))->orWhere('id', $request->query('period')));
        }
        if ($request->filled('department')) {
            $q->whereHas('cat.municipality', fn ($m) => $m->where('department_id', $request->query('department')));
        }
        if ($request->filled('level')) {
            $q->whereHas('program', fn ($p) => $p->where('level_id', $request->query('level')));
        }

        return $q->limit(2000)->get()->map(fn ($o) => [
            'program' => $o->program->name, 'program_slug' => $o->program->slug, 'level' => $o->program->level->name,
            'cat' => $o->cat->name, 'cat_slug' => $o->cat->slug, 'department' => $o->cat->municipality->department->name,
            'period' => $o->period->code, 'admits_new' => $o->admits_new, 'approved_quota' => $o->approved_quota, 'is_demo' => $o->is_demo,
        ]);
    }

    // ------------------------------------------------------------------ noticias, actividades, multimedia, páginas

    private function newsQuery(): Builder
    {
        return $this->published(News::query())->with(['category', 'cover', 'cat:id,name,slug']);
    }

    private function newsCard(News $n): array
    {
        return [
            'slug' => $n->slug, 'title' => $n->title, 'summary' => $n->summary, 'date' => $n->publish_at?->toIso8601String(),
            'category' => $n->category?->name, 'image_url' => $n->cover?->url, 'cat' => $n->cat?->name, 'is_demo' => $n->is_demo,
        ];
    }

    private function eventCard(Event $e): array
    {
        return [
            'slug' => $e->slug, 'title' => $e->title, 'summary' => $e->summary, 'starts_at' => $e->starts_at?->toIso8601String(),
            'ends_at' => $e->ends_at?->toIso8601String(), 'location' => $e->location, 'category' => $e->category, 'cat' => $e->cat?->name, 'is_demo' => $e->is_demo,
        ];
    }

    private function mediaCard(MediaItem $m): array
    {
        return ['id' => $m->id, 'title' => $m->title, 'type' => $m->type, 'url' => $m->file?->url, 'video_url' => $m->video_url, 'description' => $m->description, 'album' => $m->album, 'date' => $m->publish_at?->toIso8601String(), 'is_demo' => $m->is_demo];
    }

    public function news(Request $request)
    {
        $q = $this->newsQuery()->orderByDesc('publish_at');
        if ($request->filled('category')) {
            $q->whereHas('category', fn ($c) => $c->where('slug', $request->query('category')));
        }
        if ($t = $request->query('q')) {
            $q->where(fn ($w) => $w->where('title', 'like', "%$t%")->orWhere('summary', 'like', "%$t%"));
        }
        $page = $q->paginate(12);
        $page->setCollection($page->getCollection()->map(fn ($n) => $this->newsCard($n)));

        return $page;
    }

    public function newsCategories()
    {
        return NewsCategory::orderBy('name')->get(['slug', 'name']);
    }

    public function newsItem(string $slug)
    {
        $n = $this->newsQuery()->where('slug', $slug)->firstOrFail();

        return $this->newsCard($n) + [
            'body' => $n->body,
            'related' => $this->newsQuery()->where('id', '!=', $n->id)->when($n->category_id, fn ($q) => $q->where('category_id', $n->category_id))->orderByDesc('publish_at')->limit(3)->get()->map(fn ($x) => $this->newsCard($x)),
        ];
    }

    public function events(Request $request)
    {
        $q = $this->published(Event::query())->with('cat:id,name');
        if ($request->query('when') === 'past') {
            $q->where('starts_at', '<', now()->startOfDay())->orderByDesc('starts_at');
        } else {
            $q->where('starts_at', '>=', now()->startOfDay())->orderBy('starts_at');
        }
        if ($request->filled('month')) { // YYYY-MM
            [$y, $m] = array_map('intval', explode('-', $request->query('month')) + [1 => 1]);
            $q->whereYear('starts_at', $y)->whereMonth('starts_at', $m);
        }
        if ($request->filled('category')) {
            $q->where('category', $request->query('category'));
        }
        $page = $q->paginate(20);
        $page->setCollection($page->getCollection()->map(fn ($e) => $this->eventCard($e)));

        return $page;
    }

    public function event(string $slug)
    {
        $e = $this->published(Event::query())->with(['cat:id,name,slug', 'cover'])->where('slug', $slug)->firstOrFail();

        return $this->eventCard($e) + ['body' => $e->body, 'image_url' => $e->cover?->url, 'cat_slug' => $e->cat?->slug];
    }

    public function media(Request $request)
    {
        $q = $this->published(MediaItem::query())->with('file')->where(fn ($w) => $w->where('type', 'video')->orWhere('image_authorized', true))->orderByDesc('publish_at');
        foreach (['type', 'album'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }
        $page = $q->paginate(24);
        $page->setCollection($page->getCollection()->map(fn ($m) => $this->mediaCard($m)));

        return $page->toArray() + ['albums' => $this->published(MediaItem::query())->whereNotNull('album')->distinct()->pluck('album')];
    }

    public function page(string $slug)
    {
        return Page::where('slug', $slug)->where('status', 'publicado')->firstOrFail(['slug', 'title', 'body', 'updated_at']);
    }

    // ------------------------------------------------------------------ proyectos, convenios, documentos

    public function projects(Request $request)
    {
        $q = $this->publishedEntity(Project::query())->with(['cats.municipality.department'])->orderByDesc('start_date');
        foreach (['status', 'investment_line'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }
        if ($request->filled('cat')) {
            $q->whereHas('cats', fn ($c) => $c->where('cats.id', $request->query('cat')));
        }
        if ($request->filled('department')) {
            $q->whereHas('cats.municipality', fn ($m) => $m->where('department_id', $request->query('department')));
        }

        return $q->get()->map(fn ($p) => $p->only(['id', 'slug', 'code', 'name', 'objective', 'investment_line', 'status', 'location', 'approved_amount', 'executed_amount', 'progress_pct', 'beneficiaries_count', 'start_date', 'end_date', 'is_demo']) + [
            'cats' => $p->cats->map(fn ($c) => ['name' => $c->name, 'slug' => $c->slug, 'department' => $c->municipality->department->name, 'department_code' => $c->municipality->department->code]),
        ]);
    }

    public function project(string $slug)
    {
        $p = $this->publishedEntity(Project::query())->with(['cats:id,name,slug', 'progress', 'cover'])->where('slug', $slug)->firstOrFail();
        $data = $p->toArray();
        unset($data['dependency_id']);
        $data['image_url'] = $p->cover?->url;
        $data['agreements'] = $p->agreements()->where('is_public', true)->get(['number', 'counterpart', 'object', 'status', 'start_date', 'end_date', 'contributed_amount']);
        $data['documents'] = $this->publicDocuments()->where('related_type', 'project')->where('related_id', $p->id)->get()->map(fn ($d) => $this->documentCard($d));

        return $data;
    }

    private function publicDocuments(): Builder
    {
        return Document::with('category:id,name', 'latestVersion.file')->where('confidentiality', 'publico')->where('status', 'vigente')->orderByDesc('updated_at');
    }

    private function documentCard(Document $d): array
    {
        return ['id' => $d->id, 'title' => $d->title, 'description' => $d->description, 'category' => $d->category?->name, 'date' => $d->updated_at?->toDateString(),
            'size_bytes' => $d->latestVersion?->file?->size_bytes, 'mime' => $d->latestVersion?->file?->mime, 'version' => $d->current_version];
    }

    public function documents(Request $request)
    {
        $q = $this->publicDocuments();
        if ($request->filled('category')) {
            $q->whereHas('category', fn ($c) => $c->where('code', $request->query('category')));
        }
        if ($t = $request->query('q')) {
            $q->where(fn ($w) => $w->where('title', 'like', "%$t%")->orWhere('description', 'like', "%$t%"));
        }
        $page = $q->paginate(20);
        $page->setCollection($page->getCollection()->map(fn ($d) => $this->documentCard($d)));

        return $page->toArray() + ['categories' => DocumentCategory::whereHas('documents', fn ($d) => $d->where('confidentiality', 'publico'))->get(['code', 'name'])];
    }

    public function documentDownload(int $id)
    {
        $d = $this->publicDocuments()->findOrFail($id);
        $f = $d->latestVersion->file;

        return Storage::disk($f->disk)->download($f->path, $f->original_name, ['Content-Type' => $f->mime, 'X-Content-Type-Options' => 'nosniff']);
    }

    // ------------------------------------------------------------------ buscador

    public function search(Request $request)
    {
        $t = trim((string) $request->query('q'));
        $type = $request->query('type');
        if (mb_strlen($t) < 2) {
            return ['query' => $t, 'results' => []];
        }
        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $t).'%';
        $want = fn (string $k) => ! $type || $type === $k;
        $res = [];

        if ($want('programas')) {
            foreach ($this->publishedEntity(Program::query())->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('description', 'like', $like))->limit(10)->get() as $p) {
                $res[] = ['type' => 'programas', 'title' => $p->name, 'excerpt' => mb_substr(strip_tags((string) $p->description), 0, 160), 'url' => '/programas/'.$p->slug];
            }
        }
        if ($want('cat')) {
            foreach ($this->publishedEntity(Cat::query())->with('municipality')->where(fn ($w) => $w->where('name', 'like', $like)->orWhereHas('municipality', fn ($m) => $m->where('name', 'like', $like)))->limit(10)->get() as $c) {
                $res[] = ['type' => 'cat', 'title' => $c->name, 'excerpt' => $c->municipality->name, 'url' => '/cat/'.$c->slug];
            }
        }
        if ($want('noticias')) {
            foreach ($this->newsQuery()->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('summary', 'like', $like)->orWhere('body', 'like', $like))->limit(10)->get() as $n) {
                $res[] = ['type' => 'noticias', 'title' => $n->title, 'excerpt' => $n->summary, 'url' => '/noticias/'.$n->slug, 'date' => $n->publish_at?->toDateString()];
            }
        }
        if ($want('actividades')) {
            foreach ($this->published(Event::query())->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('summary', 'like', $like))->limit(10)->get() as $e) {
                $res[] = ['type' => 'actividades', 'title' => $e->title, 'excerpt' => $e->summary, 'url' => '/actividades/'.$e->slug, 'date' => $e->starts_at?->toDateString()];
            }
        }
        if ($want('proyectos')) {
            foreach ($this->publishedEntity(Project::query())->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('objective', 'like', $like))->limit(10)->get() as $p) {
                $res[] = ['type' => 'proyectos', 'title' => $p->name, 'excerpt' => mb_substr((string) $p->objective, 0, 160), 'url' => '/proyectos/'.$p->slug];
            }
        }
        if ($want('indicadores')) {
            foreach (Indicator::with('module')->where('is_active', true)->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('information_required', 'like', $like)->orWhere('code', 'like', $like))->limit(15)->get() as $i) {
                $res[] = ['type' => 'indicadores', 'title' => $i->code.' · '.$i->name, 'excerpt' => $i->module->name, 'url' => '/estadisticas/'.$i->module->slug.'#'.$i->code];
            }
        }
        if ($want('publicaciones')) {
            foreach ($this->publicDocuments()->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('description', 'like', $like))->limit(10)->get() as $d) {
                $res[] = ['type' => 'publicaciones', 'title' => $d->title, 'excerpt' => $d->category?->name, 'url' => '/transparencia#doc-'.$d->id];
            }
            foreach (Page::where('status', 'publicado')->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('body', 'like', $like))->limit(5)->get() as $p) {
                $res[] = ['type' => 'publicaciones', 'title' => $p->title, 'excerpt' => mb_substr(strip_tags((string) $p->body), 0, 160), 'url' => '/pagina/'.$p->slug];
            }
            foreach ($this->publishedEntity(CatalogItem::query())->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('description', 'like', $like))->limit(10)->get() as $c) {
                $res[] = ['type' => 'publicaciones', 'title' => $c->title, 'excerpt' => $c->category, 'url' => $c->url ?: '/estadisticas'];
            }
        }

        return ['query' => $t, 'results' => $res];
    }
}
