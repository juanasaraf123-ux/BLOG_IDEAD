<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\RecordImport;
use App\Services\Records\RecordDefinitions;
use App\Services\Records\RecordImporter;
use App\Services\Records\RecordTemplate;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Bases de datos institucionales (estudiantes, docentes, graduados, personal):
 * plantilla → revisión del archivo → carga → consulta → historial.
 * Consultar exige records.view; cargar, records.import; ver nombres y documentos, records.view_personal (queda en auditoría).
 */
class RecordController extends Controller
{
    public function __construct(private RecordImporter $importer) {}

    private function can(Request $r, string $perm): void
    {
        abort_unless($r->user()->hasPermission($perm), 403);
    }

    private function canAny(Request $r, array $perms): void
    {
        abort_unless(collect($perms)->contains(fn ($p) => $r->user()->hasPermission($p)), 403);
    }

    private function table(array $def): string
    {
        return (new $def['model'])->getTable();
    }

    /** Resumen de las cuatro bases para la pantalla principal. */
    public function index(Request $request)
    {
        $this->canAny($request, ['records.view', 'records.import']);
        $out = [];
        foreach (RecordDefinitions::all() as $entity => $def) {
            $def['entity'] = $entity;
            $table = $this->table($def);
            $last = RecordImport::with(['creator:id,name', 'period:id,code'])->where('entity', $table)->where('status', 'cargado')->latest('id')->first();
            $out[] = [
                'entity' => $entity, 'title' => $def['title'], 'short' => $def['short'], 'icon' => $def['icon'], 'source' => $def['source'],
                'description' => $def['description'], 'by_period' => $def['by_period'],
                'total' => DB::table($table)->count(),
                'periods' => $this->periodsWithData($def),
                'last_import' => $last ? ['date' => $last->created_at?->toIso8601String(), 'user' => $last->creator?->name, 'period' => $last->period?->code, 'rows' => $last->rows_valid] : null,
            ];
        }

        return ['data' => $out, 'can' => [
            'import' => $request->user()->hasPermission('records.import'),
            'view_personal' => $request->user()->hasPermission('records.view_personal'),
        ]];
    }

    private function periodsWithData(array $def): array
    {
        return DB::table($this->table($def).' as t')->join('academic_periods as p', 'p.id', '=', 't.period_id')
            ->groupBy('p.id', 'p.code', 'p.year', 'p.term')->orderByDesc('p.year')->orderByDesc('p.term')
            ->get(['p.id', 'p.code', DB::raw('count(*) as total')])->map(fn ($r) => ['id' => $r->id, 'code' => $r->code, 'total' => (int) $r->total])->all();
    }

    /** Definición de columnas (para mostrar ayuda en pantalla). */
    public function show(Request $request, string $entity)
    {
        $this->canAny($request, ['records.view', 'records.import']);
        $def = RecordDefinitions::get($entity);

        return [
            'entity' => $entity, 'title' => $def['title'], 'source' => $def['source'], 'description' => $def['description'], 'by_period' => $def['by_period'],
            'icon' => $def['icon'],
            'columns' => array_map(fn ($c) => ['key' => $c['key'], 'label' => $c['label'], 'required' => $c['required'], 'help' => $c['help']], $def['columns']),
            'periods' => $this->periodsWithData($def),
        ];
    }

    public function template(Request $request, string $entity)
    {
        $this->canAny($request, ['records.view', 'records.import']);
        $def = RecordDefinitions::get($entity);
        $path = RecordTemplate::build($def);

        return response()->download($path, 'Plantilla_'.str_replace(' ', '_', $def['short']).'_IDEAD.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend();
    }

    private function analyzeRequest(Request $request, array $def): array
    {
        $request->validate([
            'file' => 'required|file|max:15360',
            'period_id' => $def['by_period'] ? 'required|integer|exists:academic_periods,id' : 'nullable',
        ], ['period_id.required' => 'Seleccione el semestre al que corresponde la base.', 'file.max' => 'El archivo no puede superar 15 MB.']);
        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $period = $def['by_period'] ? AcademicPeriod::findOrFail($request->integer('period_id')) : null;
        $read = $this->importer->read($def, $file->getRealPath(), $ext);
        $result = $this->importer->validate($def, $read, $period);

        return [$read, $result, $period, $file->getClientOriginalName()];
    }

    /** Revisa el archivo sin guardar nada. */
    public function analyze(Request $request, string $entity)
    {
        $this->can($request, 'records.import');
        $def = RecordDefinitions::get($entity);
        [$read, $result, $period] = $this->analyzeRequest($request, $def);
        $existing = $period ? $def['model']::where('period_id', $period->id)->count() : 0;

        return [
            'rows_total' => count($read['rows']),
            'rows_valid' => count($result['valid']),
            'rows_error' => $result['error_rows'],
            'errors' => $result['errors'],
            'missing_columns' => $read['missing'],
            'unknown_columns' => $read['unknown'],
            'replaces' => $existing,
            'period' => $period?->code,
            'sample' => $this->sample($def, array_slice($result['valid'], 0, 8)),
        ];
    }

    /** Guarda las filas válidas del archivo. */
    public function import(Request $request, string $entity)
    {
        $this->can($request, 'records.import');
        $def = RecordDefinitions::get($entity);
        [$read, $result, $period, $name] = $this->analyzeRequest($request, $def);
        abort_if(! $result['valid'], 422, 'El archivo no tiene filas válidas para cargar.');
        $imp = $this->importer->import($def, $result['valid'], ['rows_total' => count($read['rows'])] + $result, $period, $request->user(), $name);
        Audit::log('records.import', $imp, ['entity' => $entity, 'period' => $period?->code, 'rows' => $imp->rows_valid]);

        return ['id' => $imp->id, 'rows_valid' => $imp->rows_valid, 'rows_error' => $imp->rows_error, 'period' => $period?->code];
    }

    /** Muestra para la revisión: sin nombres ni documentos completos. */
    private function sample(array $def, array $rows): array
    {
        $names = $this->names();

        return array_map(function ($v) use ($names) {
            $a = $v['attrs'];
            $doc = (string) $a['document_number'];

            return [
                'fila' => $v['line'],
                'documento' => $a['document_type'].' ···'.substr($doc, -3),
                'programa' => $names['programs'][$a['program_id'] ?? $a['_assignment']['program_id'] ?? 0] ?? '—',
                'cat' => $names['cats'][$a['cat_id'] ?? $a['_assignment']['cat_id'] ?? 0] ?? '—',
                'sexo' => isset($a['sex']) ? (RecordDefinitions::SEX[$a['sex']] ?? '—') : '—',
            ];
        }, $rows);
    }

    private function names(): array
    {
        return [
            'programs' => DB::table('programs')->pluck('name', 'id')->all(),
            'cats' => DB::table('cats')->pluck('name', 'id')->all(),
            'dependencies' => DB::table('dependencies')->pluck('name', 'id')->all(),
        ];
    }

    /** Totales por grupo para la pestaña «Consultar». */
    public function summary(Request $request, string $entity)
    {
        $this->canAny($request, ['records.view', 'records.import']);
        $def = RecordDefinitions::get($entity);
        $q = $this->filtered($request, $def);
        $names = $this->names();
        $count = fn ($col) => (clone $q)->whereNotNull($col)->groupBy($col)->select($col.' as k', DB::raw('count(*) as n'))->orderByDesc('n')->get()->map(fn ($r) => ['k' => $r->k, 'n' => (int) $r->n]);
        $label = fn ($rows, $map) => $rows->map(fn ($r) => ['label' => $map[$r['k']] ?? (string) $r['k'], 'count' => $r['n']])->values()->all();
        $opt = fn ($key) => collect($def['columns'])->firstWhere('key', $key)['options'] ?? [];

        $groups = [];
        $personKey = match ($entity) { 'estudiantes' => 'student_key', 'docentes' => 'teacher_key', 'graduados' => 'graduate_key', 'personal' => 'staff_key' };
        $kpis = [
            ['label' => match ($entity) { 'graduados' => 'Títulos otorgados', 'docentes' => 'Docentes', default => 'Registros' }, 'value' => (clone $q)->count()],
            ['label' => 'Personas distintas', 'value' => (clone $q)->distinct()->count($personKey)],
        ];
        if ($entity === 'docentes') {
            $aq = DB::table('teacher_assignments')->whereIn('teacher_id', (clone $q)->select('id'));
            $groups[] = ['title' => 'Por CAT', 'rows' => $label($aq->clone()->groupBy('cat_id')->select('cat_id as k', DB::raw('count(distinct teacher_id) as n'))->orderByDesc('n')->get()->map(fn ($r) => ['k' => $r->k, 'n' => (int) $r->n]), $names['cats'])];
            $groups[] = ['title' => 'Por vinculación', 'rows' => $label($count('contract_type'), $opt('vinculacion'))];
            $groups[] = ['title' => 'Por nivel de formación', 'rows' => $label($count('max_education'), $opt('nivel_formacion'))];
            $kpis[1] = ['label' => 'Cursos asignados', 'value' => (int) $aq->clone()->sum('courses')];
        } elseif ($entity === 'personal') {
            $groups[] = ['title' => 'Por condición', 'rows' => $label($count('staff_type'), $opt('condicion'))];
            $groups[] = ['title' => 'Por CAT', 'rows' => $label($count('cat_id'), $names['cats'])];
            $groups[] = ['title' => 'Por dependencia', 'rows' => $label($count('dependency_id'), $names['dependencies'])];
        } else {
            $groups[] = ['title' => 'Por CAT', 'rows' => $label($count('cat_id'), $names['cats'])];
            $groups[] = ['title' => 'Por programa', 'rows' => $label($count('program_id'), $names['programs'])];
            if ($entity === 'estudiantes') {
                $kpis[] = ['label' => 'Primer ingreso', 'value' => (clone $q)->where('is_new', true)->count()];
            }
        }
        $groups[] = ['title' => 'Por sexo', 'rows' => $label($count('sex'), RecordDefinitions::SEX)];

        return ['kpis' => $kpis, 'groups' => $groups];
    }

    private function filtered(Request $request, array $def)
    {
        $q = DB::table($this->table($def));
        if ($request->filled('period_id')) {
            $q->where('period_id', $request->integer('period_id'));
        }
        if ($request->filled('cat_id')) {
            $def['entity'] === 'docentes'
                ? $q->whereIn('id', DB::table('teacher_assignments')->where('cat_id', $request->integer('cat_id'))->select('teacher_id'))
                : $q->where('cat_id', $request->integer('cat_id'));
        }
        if ($request->filled('program_id')) {
            $def['entity'] === 'docentes'
                ? $q->whereIn('id', DB::table('teacher_assignments')->where('program_id', $request->integer('program_id'))->select('teacher_id'))
                : ($def['entity'] === 'personal' ? null : $q->where('program_id', $request->integer('program_id')));
        }

        return $q;
    }

    /** Listado de registros. Con personal=1 y el permiso records.view_personal se descifran nombre y documento (queda en auditoría). */
    public function rows(Request $request, string $entity)
    {
        $this->canAny($request, ['records.view', 'records.import']);
        $def = RecordDefinitions::get($entity);
        $personal = $request->boolean('personal');
        if ($personal) {
            $this->can($request, 'records.view_personal');
        }
        $ids = $this->filtered($request, $def)->orderByDesc('id')->paginate(min(100, max(10, $request->integer('per_page', 25))), ['id']);
        $models = $def['model']::with(match ($entity) {
            'docentes' => ['assignments.cat:id,name', 'assignments.program:id,name', 'period:id,code'],
            'personal' => ['cat:id,name', 'dependency:id,name', 'period:id,code'],
            default => ['cat:id,name', 'program:id,name', 'period:id,code'],
        })->whereIn('id', collect($ids->items())->pluck('id'))->orderByDesc('id')->get();
        $opt = fn ($key) => collect($def['columns'])->firstWhere('key', $key)['options'] ?? [];

        $data = $models->map(function ($m) use ($entity, $personal, $opt) {
            $row = ['id' => $m->id, 'periodo' => $m->period?->code];
            if ($personal) {
                $row['nombre'] = $m->full_name;
                $row['documento'] = $m->document_type.' '.$m->document_number;
                $row['correo'] = $m->email;
            } else {
                $row['documento'] = $m->document_type.' ···'.substr((string) $m->document_number, -3);
            }

            return $row + match ($entity) {
                'estudiantes' => ['programa' => $m->program?->name, 'cat' => $m->cat?->name, 'estado' => $opt('estado_matricula')[$m->enrollment_status] ?? $m->enrollment_status, 'primer_ingreso' => $m->is_new ? 'Sí' : 'No', 'sexo' => RecordDefinitions::SEX[$m->sex] ?? '—'],
                'docentes' => ['vinculacion' => $opt('vinculacion')[$m->contract_type] ?? $m->contract_type, 'formacion' => $opt('nivel_formacion')[$m->max_education] ?? '—', 'cat' => $m->assignments->pluck('cat.name')->unique()->implode(', '), 'cursos' => $m->assignments->sum('courses')],
                'graduados' => ['programa' => $m->program?->name, 'cat' => $m->cat?->name, 'fecha_grado' => $m->graduation_date?->format('d/m/Y'), 'sexo' => RecordDefinitions::SEX[$m->sex] ?? '—'],
                'personal' => ['condicion' => $opt('condicion')[$m->staff_type] ?? $m->staff_type, 'cargo' => $m->position, 'dependencia' => $m->dependency?->name, 'cat' => $m->cat?->name],
            };
        })->values();
        if ($personal) {
            Audit::log('records.view_personal', null, ['entity' => $entity, 'page' => $ids->currentPage(), 'rows' => $data->count()]);
        }

        return ['data' => $data, 'meta' => ['current_page' => $ids->currentPage(), 'last_page' => $ids->lastPage(), 'total' => $ids->total()]];
    }

    /** Historial de cargas de una base. */
    public function imports(Request $request, string $entity)
    {
        $this->canAny($request, ['records.view', 'records.import']);
        $def = RecordDefinitions::get($entity);

        return ['data' => RecordImport::with(['creator:id,name', 'period:id,code'])->where('entity', $this->table($def))->latest('id')->limit(100)->get()
            ->map(fn ($i) => [
                'id' => $i->id, 'date' => $i->created_at?->toIso8601String(), 'user' => $i->creator?->name, 'period' => $i->period?->code,
                'file_name' => $i->file_name, 'rows_valid' => $i->rows_valid, 'rows_error' => $i->rows_error, 'status' => $i->status,
            ])];
    }

    /** Deshace una carga vigente (elimina sus registros). */
    public function undo(Request $request, string $entity, int $id)
    {
        $this->can($request, 'records.import');
        $def = RecordDefinitions::get($entity);
        $imp = RecordImport::where('entity', $this->table($def))->findOrFail($id);
        abort_unless($imp->status === 'cargado', 422, 'Solo se puede deshacer una carga vigente.');
        $this->importer->undo($def, $imp);
        Audit::log('records.undo', $imp, ['entity' => $entity]);

        return response()->noContent();
    }
}
