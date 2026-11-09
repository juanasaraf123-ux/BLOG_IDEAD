<?php

namespace Database\Seeders;

use App\Models\AcademicPeriod;
use App\Models\Agreement;
use App\Models\Cat;
use App\Models\CatalogItem;
use App\Models\Classifier;
use App\Models\DataSubmission;
use App\Models\Department;
use App\Models\Dependency;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\DocumentVersion;
use App\Models\EducationLevel;
use App\Models\Event;
use App\Models\HeroSlide;
use App\Models\Indicator;
use App\Models\IndicatorValue;
use App\Models\KnowledgeArea;
use App\Models\Municipality;
use App\Models\News;
use App\Models\NewsCategory;
use App\Models\PettyCashBudget;
use App\Models\PettyCashExpense;
use App\Models\Program;
use App\Models\ProgramOffering;
use App\Models\Project;
use App\Models\ProjectProgress;
use App\Models\Role;
use App\Models\StoredFile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * DATOS DE DEMOSTRACIÓN — NO SON CIFRAS OFICIALES.
 *
 * Todos los registros se marcan con is_demo = true y el portal los muestra con el aviso «DATOS DE DEMOSTRACIÓN»,
 * y solo cuando IDEAD_DEMO_DATA=true. Sirven para revisar el diseño y probar el flujo completo.
 * Se niega a ejecutarse en producción.
 *
 * Uso: php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    private array $cats = [];

    private array $programs = [];

    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->error('DemoDataSeeder no puede ejecutarse en producción.');

            return;
        }
        mt_srand(2026);
        DB::transaction(function () {
            $users = $this->users();
            $this->territory();
            $this->programs();
            $this->indicatorValues($users);
            $this->content($users);
            $this->projects();
            $this->lists();
            $this->documents($users);
        });
        $this->command?->info('Datos de demostración creados. Contraseña de los usuarios demo: variable DEMO_PASSWORD.');
    }

    private function users(): array
    {
        $password = env('DEMO_PASSWORD', 'Demo-IDEAD-2026!');
        $deps = Dependency::pluck('id', 'code');
        $defs = [
            'director' => ['Director (demo)', 'director@demo.idead.local', ['DIRECCION']],
            'administracion_documental' => ['Gestión documental (demo)', 'documental@demo.idead.local', ['GESTION_DOC']],
            'caja_menor' => ['Caja menor (demo)', 'cajamenor@demo.idead.local', ['CAJA_MENOR']],
            'comunicaciones' => ['Comunicaciones (demo)', 'comunicaciones@demo.idead.local', ['COMUNICACIONES']],
            'coordinador' => ['Coordinador DARCA/CRIDEAD (demo)', 'coordinador@demo.idead.local', array_keys(\Database\Seeders\BaseCatalogSeeder::DEPENDENCIES)],
            'admin_tecnico' => ['Administrador técnico (demo)', 'admin@demo.idead.local', []],
        ];
        $out = [];
        foreach ($defs as $role => [$name, $email, $depCodes]) {
            $u = User::firstOrNew(['email' => $email]);
            $u->name = $name;
            $u->password = $password;
            $u->is_active = true;
            $u->save();
            $u->roles()->sync([Role::where('code', $role)->value('id')]);
            $u->dependencies()->sync(collect($depCodes)->map(fn ($c) => $deps[$c] ?? null)->filter()->values());
            $out[$role] = $u;
        }

        return $out;
    }

    private function territory(): void
    {
        $munis = [
            // código DANE, nombre, depto, lat, lng (aprox. cabecera municipal)
            ['73001', 'Ibagué', '73', 4.4389, -75.2322], ['73168', 'Chaparral', '73', 3.7236, -75.4847], ['73349', 'Honda', '73', 5.2083, -74.7358],
            ['73411', 'Líbano', '73', 4.9211, -75.0622], ['73449', 'Melgar', '73', 4.2047, -74.6406], ['73585', 'Purificación', '73', 3.8589, -74.9314],
            ['73268', 'Espinal', '73', 4.1492, -74.8844], ['73443', 'San Sebastián de Mariquita', '73', 5.1989, -74.8928], ['73555', 'Planadas', '73', 3.1975, -75.6447],
            ['11001', 'Bogotá, D.C.', '11', 4.7110, -74.0721], ['41001', 'Neiva', '41', 2.9273, -75.2819], ['41551', 'Pitalito', '41', 1.8536, -76.0510],
            ['25307', 'Girardot', '25', 4.3029, -74.8036], ['25290', 'Fusagasugá', '25', 4.3365, -74.3638], ['50001', 'Villavicencio', '50', 4.1420, -73.6266],
            ['85001', 'Yopal', '85', 5.3378, -72.3959], ['76001', 'Cali', '76', 3.4516, -76.5320], ['18001', 'Florencia', '18', 1.6144, -75.6062],
        ];
        $deps = Department::pluck('id', 'code');
        foreach ($munis as [$code, $name, $dep, $lat, $lng]) {
            Municipality::updateOrCreate(['code' => $code], ['name' => $name, 'department_id' => $deps[$dep], 'latitude' => $lat, 'longitude' => $lng]);
        }
        $m = Municipality::pluck('id', 'code');
        $cats = [
            ['Ibagué', '73001', ['73001', '73268', '73443', '73411'], 2004],
            ['Chaparral', '73168', ['73168', '73555'], 2006], ['Honda', '73349', ['73349', '73443'], 2008], ['Líbano', '73411', ['73411'], 2009],
            ['Melgar', '73449', ['73449', '25307'], 2010], ['Purificación', '73585', ['73585'], 2011], ['Bogotá', '11001', ['11001', '25290'], 2005],
            ['Neiva', '41001', ['41001', '41551'], 2012], ['Girardot', '25307', ['25307'], 2014], ['Villavicencio', '50001', ['50001'], 2016],
            ['Yopal', '85001', ['85001'], 2018], ['Florencia', '18001', ['18001'], 2019],
        ];
        $cridead = Dependency::where('code', 'CRIDEAD')->value('id');
        foreach ($cats as $i => [$name, $code, $coverage, $year]) {
            $muni = Municipality::where('code', $code)->first();
            $cat = Cat::updateOrCreate(['slug' => Str::slug('cat-'.$name)], [
                'name' => 'CAT '.$name, 'municipality_id' => $muni->id, 'address' => 'Dirección pendiente (demo)',
                'latitude' => $muni->latitude, 'longitude' => $muni->longitude, 'coords_verified' => true,
                'history' => '<p><strong>Texto de demostración.</strong> Aquí se publicará la breve historia del CAT '.$name.', suministrada por CRIDEAD y la coordinación del centro.</p>',
                'phone' => 'Pendiente', 'email' => null, 'schedule' => "Lunes a viernes: 8:00 a. m. – 12:00 m. y 2:00 p. m. – 6:00 p. m.\nSábados: 7:00 a. m. – 5:00 p. m. (demo)",
                'manager_name' => 'Coordinación CAT '.$name.' (demo)', 'manager_public' => false, 'opened_on' => "$year-02-01",
                'status' => $i === 11 ? 'reactivado' : 'activo', 'publication_status' => 'publicado', 'dependency_id' => $cridead, 'is_demo' => true,
            ]);
            $cat->coverage()->sync(collect($coverage)->map(fn ($c) => $m[$c]));
            $cat->sites()->delete();
            $cat->sites()->create(['name' => 'Sede principal '.$name, 'ownership' => ['publica', 'privada', 'propia'][$i % 3], 'address' => 'Pendiente (demo)']);
            $cat->facilities()->delete();
            foreach (['aula' => 6, 'sala_computo' => 1, 'biblioteca' => 1, 'auditorio' => 1, 'laboratorio' => 1] as $type => $base) {
                $cat->facilities()->create(['facility_type' => $type, 'quantity' => $base + mt_rand(0, 4), 'capacity' => mt_rand(20, 40)]);
            }
            $cat->events()->delete();
            $cat->events()->create(['event_type' => 'apertura', 'event_date' => "$year-02-01", 'description' => 'Inicio de actividades académicas (demo)']);
            if ($i === 11) {
                $cat->events()->create(['event_type' => 'reactivacion', 'event_date' => '2025-08-01', 'description' => 'Reactivación de la oferta (demo)']);
            }
            $this->cats[] = $cat;
        }
    }

    private function programs(): void
    {
        $lv = EducationLevel::pluck('id', 'code');
        $ar = KnowledgeArea::pluck('id', 'code');
        $defs = [
            ['Licenciatura en Pedagogía Infantil', 'universitario', 'educacion', 10], ['Licenciatura en Educación Artística', 'universitario', 'educacion', 10],
            ['Licenciatura en Ciencias Naturales y Educación Ambiental', 'universitario', 'educacion', 10], ['Licenciatura en Literatura y Lengua Castellana', 'universitario', 'educacion', 10],
            ['Administración Financiera', 'universitario', 'economia', 10], ['Administración Turística y Hotelera', 'universitario', 'economia', 9],
            ['Contaduría Pública', 'universitario', 'economia', 10], ['Ingeniería Agroecológica', 'universitario', 'agronomia', 10],
            ['Seguridad y Salud en el Trabajo', 'universitario', 'salud', 9], ['Tecnología en Regencia de Farmacia', 'tecnologico', 'salud', 6],
            ['Tecnología en Gestión de Bases de Datos', 'tecnologico', 'ingenieria', 6], ['Sociología', 'universitario', 'sociales', 10],
            ['Especialización en Pedagogía', 'especializacion', 'educacion', 2], ['Especialización en Gerencia de Proyectos', 'especializacion', 'economia', 2],
            ['Maestría en Educación', 'maestria', 'educacion', 4],
        ];
        foreach ($defs as $i => [$name, $level, $area, $sem]) {
            $p = Program::updateOrCreate(['slug' => Str::slug($name)], [
                'name' => $name, 'level_id' => $lv[$level], 'area_id' => $ar[$area], 'modality' => 'distancia', 'duration_semesters' => $sem,
                'credits' => $sem * 16, 'description' => '<p>Descripción de demostración del programa. El perfil, plan de estudios y requisitos oficiales serán suministrados por la dirección del programa.</p>',
                'qualified_registry_until' => now()->addYears(1 + $i % 6)->startOfYear()->toDateString(), 'accreditation_until' => $i % 5 === 0 ? now()->addYears(3)->toDateString() : null,
                'status' => $i === 11 ? 'en_cierre' : 'activo', 'publication_status' => 'publicado', 'is_demo' => true,
            ]);
            $this->programs[] = $p;
        }
        foreach (['2025-1', '2025-2', '2026-1', '2026-2'] as $code) {
            $period = AcademicPeriod::where('code', $code)->first();
            foreach ($this->cats as $ci => $cat) {
                foreach ($this->programs as $pi => $p) {
                    if (($ci + $pi) % 3 === 0 || ($ci === 0 && $pi < 12)) {
                        ProgramOffering::updateOrCreate(['program_id' => $p->id, 'cat_id' => $cat->id, 'period_id' => $period->id], [
                            'admits_new' => ($ci + $pi + $period->term) % 4 !== 0, 'approved_quota' => 20 + 5 * (($ci + $pi) % 6), 'act_reference' => 'Acuerdo de demostración', 'is_demo' => true,
                        ]);
                    }
                }
            }
        }
    }

    /** Genera lotes publicados (demo) con totales y desagregaciones coherentes para cada indicador numérico. */
    private function indicatorValues(array $users): void
    {
        $coord = $users['coordinador'];
        $dir = $users['director'];
        $semesters = AcademicPeriod::where('type', 'semestre')->whereBetween('year', [2022, 2026])->orderBy('year')->orderBy('term')->get();
        $years = AcademicPeriod::where('type', 'anio')->whereBetween('year', [2020, 2026])->orderBy('year')->get();
        $levels = EducationLevel::whereIn('code', ['tecnologico', 'universitario', 'especializacion', 'maestria'])->get();
        $areas = KnowledgeArea::all();
        $deptIds = collect($this->cats)->map(fn ($c) => $c->municipality->department_id)->unique()->values();

        $base = [
            'M01-I01' => 15, 'M01-I02' => 40, 'M01-I03' => 2400, 'M01-I04' => 3200, 'M01-I05' => 70, 'M01-I06' => 15,
            'M02-I01' => 9000, 'M02-I02' => 9000, 'M02-I03' => 9000, 'M02-I04' => 1800, 'M02-I05' => 9000, 'M02-I06' => 9000, 'M02-I07' => 900, 'M02-I08' => 3.7,
            'M03-I01' => 82, 'M03-I02' => 900, 'M03-I03' => 260, 'M03-I04' => 145, 'M03-I05' => 400,
            'M04-I01' => 700, 'M04-I02' => 700, 'M04-I03' => 700, 'M04-I04' => 700, 'M04-I05' => 1500, 'M04-I06' => 14, 'M04-I07' => 120, 'M04-I08' => 200,
            'M05-I01' => 1100, 'M05-I02' => 1100, 'M05-I03' => 1100, 'M05-I04' => 1100, 'M05-I05' => 55, 'M05-I06' => 300,
            'M06-I01' => 160, 'M06-I02' => 160, 'M06-I03' => 160, 'M06-I04' => 160, 'M06-I05' => 160,
            'M07-I01' => 12, 'M07-I02' => 12, 'M07-I03' => 120, 'M07-I04' => 300, 'M07-I05' => 12,
            'M08-I01' => 5000, 'M08-I02' => 5000, 'M08-I03' => 2500, 'M08-I04' => 4000, 'M08-I05' => 70,
            'M09-I01' => 14, 'M09-I02' => 260, 'M09-I03' => 30, 'M09-I04' => 90, 'M09-I05' => 60,
            'M10-I01' => 25, 'M10-I02' => 3000, 'M10-I03' => 30, 'M10-I04' => 1200,
            'M11-I01' => 42000000000, 'M11-I02' => 42000000000, 'M11-I03' => 88, 'M11-I04' => 42000000000, 'M11-I05' => 3500000,
            'M12-I01' => 18, 'M12-I02' => 18, 'M12-I03' => 18, 'M12-I04' => 9000000000, 'M12-I07' => 76,
            'M13-I01' => 15, 'M13-I02' => 65, 'M13-I04' => 7000, 'M13-I05' => 84,
        ];

        foreach (Indicator::with('classifier.items')->orderBy('module_id')->orderBy('sort')->get() as $ind) {
            if (! isset($base[$ind->code])) {
                continue; // fichas y listados sin valores numéricos
            }
            if ($ind->group_by === 'classifier' && (! $ind->classifier || $ind->classifier->items->isEmpty())) {
                continue; // clasificador sin categorías definidas (p. ej. opciones de grado)
            }
            $periods = $ind->periodicity === 'semestral' ? $semesters : $years;
            $sub = DataSubmission::create([
                'indicator_id' => $ind->id, 'title' => 'Carga de demostración', 'status' => 'borrador', 'created_by' => $coord->id,
                'source_note' => 'DATOS DE DEMOSTRACIÓN generados automáticamente — no son cifras oficiales.', 'is_demo' => true,
            ]);
            $rows = [];
            foreach ($periods as $pi => $period) {
                $growth = 1 + 0.025 * $pi + (mt_rand(-20, 20) / 1000);
                $total = $this->shape($ind, $base[$ind->code] * $growth);
                $isAdditive = in_array($ind->value_type, ['count', 'currency'], true);
                $partition = $ind->group_by !== 'classifier' || $ind->classifier->is_partition;
                if ($partition) {
                    $rows[] = ['period_id' => $period->id, 'value' => $total];
                }
                $groups = match ($ind->group_by) {
                    'cat' => collect($this->cats)->map(fn ($c) => ['cat_id' => $c->id]),
                    'program' => collect($this->programs)->take(10)->map(fn ($p) => ['program_id' => $p->id]),
                    'level' => $levels->map(fn ($l) => ['level_id' => $l->id]),
                    'area' => $areas->map(fn ($a) => ['area_id' => $a->id]),
                    'department' => $deptIds->map(fn ($d) => ['department_id' => $d]),
                    'classifier' => $ind->classifier->items->map(fn ($it) => ['classifier_item_id' => $it->id, '_label' => $it->label]),
                    default => collect(),
                };
                if ($groups->isNotEmpty()) {
                    $rows = array_merge($rows, $this->split($ind, $period->id, $total, $groups->values()->all()));
                }
                // Totales por CAT para indicadores que admiten esa desagregación (fichas de CAT)
                if ($partition && $ind->group_by !== 'cat' && in_array('cat', $ind->allowed_dimensions ?? [], true) && $isAdditive) {
                    $rows = array_merge($rows, $this->split($ind, $period->id, $total, collect($this->cats)->map(fn ($c) => ['cat_id' => $c->id])->all()));
                }
            }
            $insert = [];
            foreach ($rows as $r) {
                $full = array_merge(array_fill_keys(IndicatorValue::DIMENSIONS, null), $r);
                unset($full['_label']);
                $full['submission_id'] = $sub->id;
                $full['is_suppressed'] = false;
                $full['note'] = null;
                $full['dims_hash'] = IndicatorValue::hashDims($full);
                $insert[$full['dims_hash']] = $full;
            }
            foreach (array_chunk(array_values($insert), 500) as $chunk) {
                IndicatorValue::insert($chunk);
            }
            // Flujo completo: enviado por el coordinador, aprobado y publicado por la Dirección.
            $now = now();
            $sub->update(['status' => 'enviado', 'submitted_by' => $coord->id, 'submitted_at' => $now]);
            $sub->update(['status' => 'aprobado', 'approved_by' => $dir->id, 'approved_at' => $now]);
            if ($ind->isPublishable()) {
                $k = in_array($ind->publication_level, ['AGR', 'AGR_S'], true) ? ($ind->min_cell_size ?? 5) : null;
                if ($k && $ind->value_type === 'count') {
                    $sub->values()->where('value', '>', 0)->where('value', '<', $k)->update(['is_suppressed' => true]);
                }
                $sub->update(['status' => 'publicado', 'published_by' => $dir->id, 'published_at' => $now]);
            }
        }
    }

    private function shape(Indicator $ind, float $v): float
    {
        return match ($ind->value_type) {
            'percent' => round(min($v, 99), 1),
            'ratio', 'number' => round($v, 1),
            'currency' => round($v, -3),
            default => round($v),
        };
    }

    /** Rango de valores realistas para categorías que son medidas especiales (promedios, porcentajes, tasas...). */
    private const ITEM_RANGES = [
        'promedio' => [3.4, 4.3], 'satisfaccion' => [70, 92], 'atendidas' => [75, 98], 'graduacion_cohorte' => [25, 55], 'tiempo_titulo' => [10, 14],
        'conectividad_mbps' => [20, 300], 'admision' => [70, 95], 'ocupacion' => [55, 95], 'saber_pro' => [135, 160], 'saber_tyt' => [95, 120],
        'total' => [12, 22], 'carrera' => [40, 80], 'catedra' => [15, 30], 'general' => [60, 90], 'institucional' => [50, 90], 'academico' => [40, 85],
        'por_estudiante' => [2500000, 4500000], 'costo_estudiante' => [3000000, 6000000],
    ];

    /** Reparte un total entre grupos (por cada prefijo «Variable:» por separado) o asigna valores independientes si no es aditivo. */
    private function split(Indicator $ind, int $periodId, float $total, array $groups): array
    {
        $additive = in_array($ind->value_type, ['count', 'currency'], true)
            && ! (isset($groups[0]['classifier_item_id']) && ! $ind->classifier->is_partition);
        $buckets = [];
        foreach ($groups as $g) {
            $prefix = isset($g['_label']) && str_contains($g['_label'], ': ') ? strstr($g['_label'], ': ', true) : '_';
            $buckets[$prefix][] = $g;
        }
        $rows = [];
        foreach ($buckets as $items) {
            $weights = array_map(fn () => mt_rand(10, 100), $items);
            $sum = array_sum($weights);
            foreach ($items as $i => $g) {
                $v = $additive ? $total * $weights[$i] / $sum : $total * (0.25 + mt_rand(0, 75) / 100);
                $code = isset($g['classifier_item_id']) ? \App\Models\ClassifierItem::find($g['classifier_item_id'])->code : null;
                if ($code && isset(self::ITEM_RANGES[$code]) && in_array($ind->value_type, ['number', 'percent', 'ratio', 'currency'], true)) {
                    [$lo, $hi] = self::ITEM_RANGES[$code];
                    $v = $lo + ($hi - $lo) * mt_rand(0, 1000) / 1000;
                }
                $rows[] = ['period_id' => $periodId, 'value' => $this->shape($ind, $v)] + $g;
            }
        }

        return $rows;
    }

    private function storeDemoFile(string $source, string $disk, string $name, string $mime): StoredFile
    {
        $path = 'demo/'.Str::random(32).'.'.pathinfo($name, PATHINFO_EXTENSION);
        Storage::disk($disk)->put($path, file_get_contents($source));

        return StoredFile::create(['disk' => $disk, 'path' => $path, 'original_name' => $name, 'mime' => $mime, 'size_bytes' => filesize($source), 'sha256' => hash_file('sha256', $source)]);
    }

    private function content(array $users): void
    {
        $com = $users['comunicaciones'];
        $dir = $users['director'];
        $banner = $this->storeDemoFile(database_path('data/demo/slide-congreso.jpg'), 'public', 'congreso-turismo.jpg', 'image/jpeg');
        HeroSlide::updateOrCreate(['title' => 'IV Congreso Internacional de Turismo · II Congreso Internacional de Administración Financiera y Contaduría Pública'], [
            'subtitle' => 'Agenda Digital e Inteligencia Artificial para los negocios del siglo XXI — 2 y 3 de octubre de 2026 (pieza tomada del boceto)',
            'image_file_id' => $banner->id, 'link_url' => '/noticias/congresos-internacionales-turismo-y-contaduria-2026', 'sort' => 0, 'is_active' => true, 'is_demo' => true,
        ]);
        HeroSlide::updateOrCreate(['title' => 'Educación a distancia que llega a los territorios'], [
            'subtitle' => 'Conoce la red de Centros de Atención Tutorial del IDEAD', 'image_file_id' => null, 'link_url' => '/cat', 'sort' => 1, 'is_active' => true, 'is_demo' => true,
        ]);

        $cats = NewsCategory::pluck('id', 'slug');
        $news = [
            ['Congresos internacionales de Turismo y de Contaduría 2026', 'institucional', 'El IDEAD y la Universidad del Tolima realizaron el IV Congreso Internacional de Turismo y el II Congreso Internacional de Administración Financiera y Contaduría Pública.', -38, $banner->id, true],
            ['IDEAD fortalece su presencia en los territorios', 'territorio', 'Texto de demostración sobre el fortalecimiento de la red de Centros de Atención Tutorial.', -5, null, true],
            ['Abiertas las inscripciones para el próximo período académico', 'academica', 'Texto de demostración: fechas, requisitos y programas con cupos para estudiantes nuevos.', -9, null, false],
            ['Semilleros de investigación presentan sus avances', 'investigacion', 'Texto de demostración sobre el encuentro de semilleros de investigación del IDEAD.', -15, null, false],
            ['Jornada de bienestar en los CAT', 'bienestar', 'Texto de demostración sobre actividades de orientación, deporte y cultura de TUIDEAD.', -21, null, false],
            ['Encuentro de graduados IDEAD', 'eventos', 'Texto de demostración sobre el encuentro anual de graduados.', -30, null, false],
        ];
        foreach ($news as $i => [$title, $cat, $summary, $days, $cover, $featured]) {
            News::updateOrCreate(['slug' => Str::slug($title === $news[0][0] ? 'congresos-internacionales-turismo-y-contaduria-2026' : $title)], [
                'title' => $title, 'summary' => $summary, 'body' => '<p><strong>Contenido de demostración.</strong> '.$summary.'</p><p>El equipo de Comunicaciones reemplazará este texto desde el panel de administración.</p>',
                'category_id' => $cats[$cat], 'cover_file_id' => $cover, 'cat_id' => $i === 1 ? $this->cats[0]->id : null, 'is_featured' => $featured,
                'status' => 'publicado', 'publish_at' => now()->addDays($days), 'author_id' => $com->id, 'approved_by' => $dir->id, 'is_demo' => true,
            ]);
        }
        News::updateOrCreate(['slug' => 'borrador-pendiente-de-revision'], [
            'title' => 'Borrador pendiente de revisión', 'summary' => 'Ejemplo del flujo editorial (no visible en el portal).', 'category_id' => $cats['institucional'],
            'status' => 'en_revision', 'author_id' => $com->id, 'is_demo' => true,
        ]);
        $events = [
            ['Inducción a estudiantes nuevos', 'académica', 6], ['Encuentro regional de tutores', 'académica', 12], ['Semana del IDEAD', 'institucional', 20],
            ['Torneo deportivo interCAT', 'deportiva', 27], ['Muestra cultural de fin de semestre', 'cultural', 33], ['Taller de investigación formativa', 'investigación', 40],
        ];
        foreach ($events as $i => [$title, $cat, $days]) {
            Event::updateOrCreate(['slug' => Str::slug($title)], [
                'title' => $title, 'summary' => 'Actividad de demostración. Lugar, hora y requisitos serán publicados por Comunicaciones.', 'category' => $cat,
                'starts_at' => now()->addDays($days)->setTime(8 + $i, 0), 'ends_at' => now()->addDays($days)->setTime(12 + $i, 0),
                'location' => $this->cats[$i % count($this->cats)]->name, 'cat_id' => $this->cats[$i % count($this->cats)]->id,
                'status' => 'publicado', 'publish_at' => now()->subDay(), 'author_id' => $com->id, 'approved_by' => $dir->id, 'is_demo' => true,
            ]);
        }
        Event::updateOrCreate(['slug' => 'congresos-internacionales-2026'], [
            'title' => 'IV Congreso Internacional de Turismo y II Congreso Internacional de Administración Financiera y Contaduría Pública', 'summary' => 'Auditorio de la Academia, Universidad del Tolima.',
            'category' => 'académica', 'starts_at' => '2026-10-02 08:00:00', 'ends_at' => '2026-10-03 18:00:00', 'location' => 'Auditorio de la Academia, Universidad del Tolima',
            'cover_file_id' => $banner->id, 'status' => 'publicado', 'publish_at' => '2026-09-01 00:00:00', 'author_id' => $com->id, 'approved_by' => $dir->id, 'is_demo' => true,
        ]);
        \App\Models\MediaItem::updateOrCreate(['title' => 'Pieza gráfica de los congresos 2026'], [
            'type' => 'foto', 'file_id' => $banner->id, 'album' => 'Eventos 2026', 'image_authorized' => true, 'description' => 'Pieza gráfica tomada del boceto (demo).',
            'status' => 'publicado', 'publish_at' => now()->subDays(30), 'author_id' => $com->id, 'approved_by' => $dir->id, 'is_demo' => true,
        ]);
    }

    private function projects(): void
    {
        $defs = [
            ['Adecuación de aulas y conectividad en CAT', 'infraestructura', 'en_ejecucion', 1800000000, 0.62, [0, 1, 2]],
            ['Dotación de salas de cómputo', 'equipos', 'finalizado', 950000000, 1.0, [3, 4, 5]],
            ['Fortalecimiento de plataformas digitales de aprendizaje', 'tecnologia', 'en_ejecucion', 1200000000, 0.45, []],
            ['Programa de bienestar y permanencia en territorios', 'bienestar', 'aprobado', 600000000, 0.1, [6, 7, 8]],
            ['Renovación curricular de programas a distancia', 'academia', 'radicado', 400000000, 0.0, []],
        ];
        $crid = Dependency::where('code', 'CRIDEAD')->value('id');
        foreach ($defs as $i => [$name, $line, $status, $amount, $pct, $catIdx]) {
            $p = Project::updateOrCreate(['slug' => Str::slug($name)], [
                'code' => 'DEMO-'.(100 + $i), 'name' => $name, 'objective' => 'Objetivo de demostración del proyecto «'.$name.'».',
                'description' => '<p>Descripción de demostración. La ficha oficial será diligenciada por CRIDEAD / PRIDEAD.</p>', 'investment_line' => $line, 'status' => $status,
                'location' => $catIdx ? implode(', ', array_map(fn ($c) => $this->cats[$c]->name, $catIdx)) : 'Todos los CAT', 'approved_amount' => $amount,
                'executed_amount' => round($amount * $pct, -3), 'progress_pct' => $pct * 100, 'beneficiaries_count' => 300 + 150 * $i,
                'results' => $pct >= 1 ? 'Resultados de demostración: equipos instalados y en uso.' : null,
                'start_date' => now()->subMonths(10 - $i)->toDateString(), 'end_date' => now()->addMonths(2 + $i)->toDateString(),
                'dependency_id' => $crid, 'publication_status' => 'publicado', 'is_demo' => true,
            ]);
            $p->cats()->sync(array_map(fn ($c) => $this->cats[$c]->id, $catIdx));
            $p->progress()->delete();
            foreach ([0.25, 0.5, 0.75, 1] as $k => $f) {
                if ($pct * $f > 0) {
                    ProjectProgress::create(['project_id' => $p->id, 'reported_on' => now()->subMonths(8 - 2 * $k)->toDateString(), 'progress_pct' => round($pct * 100 * $f, 1), 'executed_amount' => round($amount * $pct * $f, -3)]);
                }
            }
        }
        foreach ([
            ['DEMO-CV-01', 'Alcaldía municipal (demo)', 'Cooperación para el funcionamiento de un CAT', 'vigente', 150000000, true],
            ['DEMO-CV-02', 'Gobernación (demo)', 'Apoyo a la conectividad de sedes', 'vigente', 300000000, true],
            ['DEMO-CV-03', 'Entidad privada (demo)', 'Prácticas y pasantías', 'terminado', null, false],
        ] as [$num, $cp, $obj, $status, $amount, $public]) {
            Agreement::updateOrCreate(['number' => $num], ['counterpart' => $cp, 'object' => $obj, 'status' => $status, 'contributed_amount' => $amount, 'is_public' => $public,
                'start_date' => now()->subYear()->toDateString(), 'end_date' => now()->addYear()->toDateString(), 'dependency_id' => Dependency::where('code', 'CRIDEAD')->value('id'), 'is_demo' => true]);
        }
    }

    private function lists(): void
    {
        $items = [
            ['plataformas_digitales', 'TuAula', 'Plataforma de aprendizaje mencionada en el Excel de indicadores. Vigencia y enlace oficial pendientes de confirmación por SAIDEAD.', 'Plataforma de aprendizaje', 'vigencia por confirmar'],
            ['plataformas_digitales', 'CloudLabs', 'Laboratorios virtuales mencionados en el Excel de indicadores. Vigencia pendiente de confirmación.', 'Laboratorios virtuales', 'vigencia por confirmar'],
            ['grupos_investigacion', 'Grupo de investigación en educación a distancia (demo)', 'Nombre y categoría de demostración.', 'Categoría por confirmar', 'vigente'],
            ['grupos_investigacion', 'Grupo de estudios territoriales (demo)', 'Nombre de demostración.', 'Categoría por confirmar', 'vigente'],
            ['semilleros', 'Semillero de pedagogía rural (demo)', null, 'Educación', 'vigente'],
            ['formacion_continua', 'Diplomado en docencia virtual (demo)', 'Oferta de demostración.', 'Diplomado', 'abierto'],
            ['formacion_continua', 'Curso de Excel financiero (demo)', 'Oferta de demostración.', 'Curso', 'abierto'],
            ['formacion_continua', 'Seminario de investigación formativa (demo)', 'Oferta de demostración.', 'Seminario', 'finalizado'],
            ['opciones_grado', 'Catálogo de opciones de grado — Acuerdo 015 de 2008 CDIDEAD', 'Pendiente: las opciones vigentes serán registradas por SAIDEAD según el acuerdo.', 'Acto administrativo', 'pendiente de validación'],
            ['hitos_oferta', 'Apertura de nuevas cohortes (demo)', 'Hito de demostración de la evolución de la oferta.', 'Nueva cohorte', 'realizado'],
            ['hitos_oferta', 'Reapertura de programa en CAT (demo)', 'Hito de demostración.', 'Reapertura', 'proyectado'],
            ['representacion_estudiantil', 'Representación estudiantil ante el Consejo Directivo (demo)', 'Se publica el número de representantes; los nombres solo si el acto es público.', 'CDIDEAD', 'vigente'],
            ['planes_mejoramiento', 'Plan de mejoramiento institucional (demo)', 'Avance de demostración.', 'Institucional', 'en ejecución'],
            ['servicios_bienestar', 'Orientación y psicología', 'Línea de servicio de bienestar (descripción de demostración).', 'TUIDEAD', 'vigente'],
            ['servicios_bienestar', 'Deporte y cultura', 'Línea de servicio de bienestar (descripción de demostración).', 'TUIDEAD', 'vigente'],
            ['servicios_bienestar', 'CRAI y biblioteca', 'Línea de servicio de bienestar (descripción de demostración).', 'Biblioteca', 'vigente'],
        ];
        foreach ($items as $i => [$type, $title, $desc, $cat, $state]) {
            CatalogItem::updateOrCreate(['list_type' => $type, 'title' => $title], ['description' => $desc, 'category' => $cat, 'state' => $state, 'year' => 2026,
                'date' => now()->subMonths($i)->toDateString(), 'publication_status' => 'publicado', 'is_demo' => true]);
        }
    }

    private function documents(array $users): void
    {
        $pdf = tempnam(sys_get_temp_dir(), 'pdf');
        file_put_contents($pdf, self::minimalPdf('DOCUMENTO DE DEMOSTRACION - IDEAD'));
        $cat = DocumentCategory::pluck('id', 'code');
        foreach ([
            ['Informe de gestión (demo)', 'informe', 'publico', $users['administracion_documental']],
            ['Contrato de prestación de servicios (demo)', 'contrato', 'restringido', $users['administracion_documental']],
            ['Factura caja menor (demo)', 'factura', 'financiero', $users['caja_menor']],
        ] as [$title, $code, $conf, $u]) {
            if (Document::where('title', $title)->exists()) {
                continue;
            }
            $file = $this->storeDemoFile($pdf, 'local', Str::slug($title).'.pdf', 'application/pdf');
            $doc = Document::create(['title' => $title, 'description' => 'Archivo de demostración.', 'category_id' => $cat[$code], 'confidentiality' => $conf, 'status' => 'vigente', 'created_by' => $u->id, 'current_version' => 1]);
            DocumentVersion::create(['document_id' => $doc->id, 'version_no' => 1, 'file_id' => $file->id, 'change_note' => 'Versión inicial', 'uploaded_by' => $u->id]);
            if ($code === 'factura') {
                $b = PettyCashBudget::create(['year' => 2026, 'name' => 'Caja menor 2026 (demo)', 'amount' => 12000000, 'created_by' => $u->id]);
                PettyCashExpense::create(['budget_id' => $b->id, 'expense_date' => now()->subDays(10)->toDateString(), 'concept' => 'Papelería (demo)', 'provider' => 'Proveedor demo', 'invoice_number' => 'FV-001', 'amount' => 350000, 'document_id' => $doc->id, 'status' => 'legalizado', 'created_by' => $u->id]);
                PettyCashExpense::create(['budget_id' => $b->id, 'expense_date' => now()->subDays(3)->toDateString(), 'concept' => 'Transporte (demo)', 'provider' => 'Proveedor demo', 'invoice_number' => 'FV-002', 'amount' => 120000, 'status' => 'registrado', 'created_by' => $u->id]);
            }
        }
        @unlink($pdf);
    }

    /** PDF mínimo válido de una página con una línea de texto. */
    public static function minimalPdf(string $text): string
    {
        $stream = 'BT /F1 18 Tf 72 720 Td ('.str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text).') Tj ET';
        $objs = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            "<< /Length ".strlen($stream)." >>\nstream\n$stream\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $out = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objs as $i => $o) {
            $offsets[] = strlen($out);
            $out .= ($i + 1)." 0 obj\n$o\nendobj\n";
        }
        $xref = strlen($out);
        $out .= "xref\n0 ".(count($objs) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $off) {
            $out .= sprintf("%010d 00000 n \n", $off);
        }

        return $out."trailer\n<< /Size ".(count($objs) + 1)." /Root 1 0 R >>\nstartxref\n$xref\n%%EOF";
    }
}
