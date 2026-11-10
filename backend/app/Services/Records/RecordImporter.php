<?php

namespace App\Services\Records;

use App\Models\AcademicPeriod;
use App\Models\Cat;
use App\Models\Dependency;
use App\Models\Graduation;
use App\Models\Municipality;
use App\Models\Program;
use App\Models\RecordImport;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Support\Pseudonym;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\CSV\Options as CsvOptions;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

/**
 * Lee una plantilla de Excel/CSV de una base institucional, valida cada celda y la guarda.
 * - analyze(): no guarda nada; devuelve resumen, errores por fila/columna y una muestra sin datos personales.
 * - import(): guarda las filas válidas. Las bases por semestre reemplazan la carga anterior del mismo semestre.
 * Los datos personales quedan cifrados por los modelos; la fecha de nacimiento no se guarda (solo el rango de edad).
 */
class RecordImporter
{
    public const MAX_ROWS = 20000;

    public const MAX_ERRORS = 500;

    private array $lookups = [];

    // ------------------------------------------------------------------ lectura

    /** @return array{header: array<int,string>, rows: array<int, array{line:int, cells: array<string,mixed>}>, unknown: array<int,string>, missing: array<int,string>} */
    public function read(array $def, string $path, string $ext): array
    {
        if ($ext === 'csv' || $ext === 'txt') {
            $first = (string) fgets(fopen($path, 'r'));
            $delimiter = substr_count($first, ';') >= substr_count($first, ',') ? ';' : ',';
            $reader = new CsvReader(new CsvOptions(FIELD_DELIMITER: $delimiter));
        } elseif ($ext === 'xlsx') {
            $reader = new XlsxReader;
        } else {
            throw ValidationException::withMessages(['file' => 'El archivo debe ser Excel (.xlsx) o CSV.']);
        }
        $aliases = [];
        foreach ($def['columns'] as $c) {
            $aliases[self::norm($c['key'])] = $c['key'];
            $aliases[self::norm($c['label'])] = $c['key'];
        }
        try {
            $reader->open($path);
        } catch (\Throwable) {
            throw ValidationException::withMessages(['file' => 'No fue posible abrir el archivo. Verifique que sea un Excel (.xlsx) o CSV válido.']);
        }
        $map = null;
        $unknown = [];
        $rows = [];
        $line = 0;
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $line++;
                $cells = $row->toArray();
                if ($map === null) {
                    $map = [];
                    foreach ($cells as $i => $h) {
                        $n = self::norm(str_replace(['*', "\u{FEFF}"], '', (string) $h));
                        if ($n === '') {
                            continue;
                        }
                        if (isset($aliases[$n])) {
                            $map[$i] = $aliases[$n];
                        } else {
                            $unknown[] = trim((string) $h);
                        }
                    }
                    if (count($map) < 2) {
                        $reader->close();
                        throw ValidationException::withMessages(['file' => 'La primera fila del archivo debe tener los encabezados de la plantilla. Descargue la plantilla y copie los datos debajo de los encabezados.']);
                    }

                    continue;
                }
                $data = [];
                $empty = true;
                foreach ($map as $i => $key) {
                    $v = $cells[$i] ?? null;
                    if (is_string($v)) {
                        $v = trim($v);
                    }
                    if ($v !== null && $v !== '') {
                        $empty = false;
                    }
                    $data[$key] = $v;
                }
                if ($empty) {
                    continue;
                }
                $rows[] = ['line' => $line, 'cells' => $data];
                if (count($rows) > self::MAX_ROWS) {
                    $reader->close();
                    throw ValidationException::withMessages(['file' => 'El archivo supera '.number_format(self::MAX_ROWS, 0, ',', '.').' filas. Divídalo en varios archivos.']);
                }
            }
            break; // solo la primera hoja («Datos»)
        }
        $reader->close();
        if ($map === null) {
            throw ValidationException::withMessages(['file' => 'El archivo está vacío.']);
        }
        $present = array_values($map);
        $missing = array_values(array_map(fn ($c) => $c['label'], array_filter($def['columns'], fn ($c) => $c['required'] && ! in_array($c['key'], $present, true))));

        return ['header' => $present, 'rows' => $rows, 'unknown' => $unknown, 'missing' => $missing];
    }

    // ------------------------------------------------------------------ validación

    /**
     * Valida todas las filas. Devuelve filas válidas (atributos listos para guardar) y errores legibles.
     */
    public function validate(array $def, array $read, ?AcademicPeriod $period): array
    {
        $this->buildLookups();
        $valid = [];
        $errors = [];
        $badLines = [];
        $seen = [];
        $ref = $period ? CarbonImmutable::parse($period->starts_on ?? now()) : null;

        if ($read['missing']) {
            return ['valid' => [], 'errors' => [['row' => 1, 'column' => implode(', ', $read['missing']), 'message' => 'Faltan columnas obligatorias en el encabezado.']], 'error_rows' => count($read['rows'])];
        }

        foreach ($read['rows'] as $r) {
            $line = $r['line'];
            $out = [];
            $rowErrors = [];
            foreach ($def['columns'] as $col) {
                $raw = $r['cells'][$col['key']] ?? null;
                $isEmpty = $raw === null || $raw === '';
                if ($isEmpty) {
                    if ($col['required']) {
                        $rowErrors[] = [$col['label'], 'Está vacía y es obligatoria.'];
                    }
                    $out[$col['key']] = null;

                    continue;
                }
                try {
                    $out[$col['key']] = $this->cast($col, $raw);
                } catch (\InvalidArgumentException $e) {
                    $rowErrors[] = [$col['label'], $e->getMessage()];
                }
            }
            if (! $rowErrors) {
                try {
                    $attrs = $this->toAttributes($def['entity'], $out, $period, $ref);
                    $dupKey = $this->duplicateKey($def['entity'], $attrs);
                    if (isset($seen[$dupKey])) {
                        $rowErrors[] = ['Número de documento', 'Está repetido en la fila '.$seen[$dupKey].' ('.$this->duplicateText($def['entity']).').'];
                    } else {
                        $seen[$dupKey] = $line;
                        $valid[] = ['line' => $line, 'attrs' => $attrs];
                    }
                } catch (\InvalidArgumentException $e) {
                    $rowErrors[] = ['', $e->getMessage()];
                }
            }
            if ($rowErrors) {
                $badLines[$line] = true;
                foreach ($rowErrors as [$c, $m]) {
                    if (count($errors) < self::MAX_ERRORS) {
                        $errors[] = ['row' => $line, 'column' => $c, 'message' => $m];
                    }
                }
            }
        }

        return ['valid' => $valid, 'errors' => $errors, 'error_rows' => count($badLines)];
    }

    private function cast(array $col, mixed $raw): mixed
    {
        $s = $raw instanceof DateTimeInterface ? $raw : trim((string) $raw);
        switch ($col['type']) {
            case 'text':
                $s = preg_replace('/\s+/u', ' ', (string) $s);
                if (mb_strlen($s) > ($col['max'] ?? 255)) {
                    throw new \InvalidArgumentException('Texto muy largo (máximo '.($col['max'] ?? 255).' caracteres).');
                }

                return $s;
            case 'email':
                if (! filter_var($s, FILTER_VALIDATE_EMAIL)) {
                    throw new \InvalidArgumentException('«'.$s.'» no es un correo válido.');
                }

                return mb_strtolower($s);
            case 'doctype':
                $n = self::norm($s);
                $map = ['cc' => 'CC', 'cedula' => 'CC', 'cedula_de_ciudadania' => 'CC', 'ti' => 'TI', 'tarjeta_de_identidad' => 'TI', 'ce' => 'CE', 'cedula_de_extranjeria' => 'CE',
                    'pa' => 'PA', 'pasaporte' => 'PA', 'pep' => 'PEP', 'ppt' => 'PPT', 'rc' => 'RC', 'registro_civil' => 'RC'];

                return $map[$n] ?? throw new \InvalidArgumentException('«'.$s.'» no es un tipo de documento válido. Use CC, TI, CE, PA, PEP, PPT o RC.');
            case 'document':
                $d = is_float($raw) || is_int($raw) ? number_format((float) $raw, 0, '', '') : preg_replace('/[\s.\-]/', '', (string) $s);
                if (! preg_match('/^[A-Za-z0-9]{4,20}$/', $d) || ! preg_match('/\d/', $d)) {
                    throw new \InvalidArgumentException('«'.$s.'» no es un número de documento válido (solo números, sin puntos).');
                }

                return strtoupper($d);
            case 'sex':
                $n = self::norm($s);
                $map = ['f' => 'femenino', 'femenino' => 'femenino', 'mujer' => 'femenino', 'm' => 'masculino', 'masculino' => 'masculino', 'hombre' => 'masculino',
                    'otro' => 'otro', 'o' => 'otro', 'no_informa' => 'no_informa', 'ni' => 'no_informa', 'sin_informacion' => 'no_informa'];

                return $map[$n] ?? throw new \InvalidArgumentException('«'.$s.'» no es válido. Use Femenino, Masculino, Otro o No informa.');
            case 'bool':
                $n = self::norm($s);
                if (in_array($n, ['si', 's', 'x', '1', 'true', 'verdadero', 'yes'], true)) {
                    return true;
                }
                if (in_array($n, ['no', 'n', '0', 'false', 'falso'], true)) {
                    return false;
                }
                throw new \InvalidArgumentException('«'.$s.'» no es válido. Escriba Sí o No.');
            case 'int':
                if (! is_numeric(str_replace(',', '.', (string) $s)) || floor((float) str_replace(',', '.', (string) $s)) != (float) str_replace(',', '.', (string) $s)) {
                    throw new \InvalidArgumentException('«'.$s.'» debe ser un número entero.');
                }
                $v = (int) $s;
                if ($v < ($col['min'] ?? PHP_INT_MIN) || $v > ($col['max'] ?? PHP_INT_MAX)) {
                    throw new \InvalidArgumentException("Debe estar entre {$col['min']} y {$col['max']}.");
                }

                return $v;
            case 'decimal':
                $v = str_replace(',', '.', (string) $s);
                if (! is_numeric($v)) {
                    throw new \InvalidArgumentException('«'.$s.'» debe ser un número (ejemplo: 4,2).');
                }
                $v = (float) $v;
                if ($v < $col['min'] || $v > $col['max']) {
                    throw new \InvalidArgumentException("Debe estar entre {$col['min']} y {$col['max']}.");
                }

                return round($v, 2);
            case 'date':
                return $this->date($raw);
            case 'enum':
                $n = self::norm($s);
                foreach ($col['options'] as $code => $label) {
                    if ($n === self::norm($code) || $n === self::norm($label) || str_starts_with(self::norm($label), $n.'_') || in_array($n, self::SYNONYMS[$code] ?? [], true)) {
                        return $code;
                    }
                }
                throw new \InvalidArgumentException('«'.$s.'» no es válido. Use: '.implode(', ', $col['options']).'.');
            case 'list':
                return array_values(array_filter(array_map('trim', preg_split('/[;|]/', (string) $s))));
            case 'program':
                return $this->find('programs', $s) ?? throw new \InvalidArgumentException('No se encontró el programa «'.$s.'». Revise la hoja «Valores válidos».');
            case 'cat':
                return $this->find('cats', $s) ?? throw new \InvalidArgumentException('No se encontró el CAT «'.$s.'». Revise la hoja «Valores válidos».');
            case 'municipality':
                return $this->find('municipalities', $s) ?? throw new \InvalidArgumentException('No se encontró el municipio «'.$s.'» (o hay varios con ese nombre; use el código DANE).');
            case 'dependency':
                return $this->find('dependencies', $s) ?? throw new \InvalidArgumentException('No se encontró la dependencia «'.$s.'». Revise la hoja «Valores válidos».');
            case 'period':
                return $this->find('periods', $s) ?? throw new \InvalidArgumentException('«'.$s.'» no es un semestre válido (ejemplo: 2020-1).');
        }

        return $s;
    }

    private const SYNONYMS = [
        'carrera' => ['planta', 'carrera', 'de_planta', 'tiempo_completo'],
        'catedra' => ['catedratico', 'hora_catedra'],
        'administrativo' => ['planta', 'administrativo', 'de_planta', 'funcionario'],
        'contratista' => ['ops', 'contrato', 'prestacion_de_servicios', 'cps'],
        'prestacion_servicios' => ['ops', 'cps', 'prestacion_de_servicios', 'contrato_de_prestacion_de_servicios'],
        'especializacion' => ['especialista'],
        'maestria' => ['magister', 'master'],
        'doctorado' => ['doctor', 'phd'],
        'profesional' => ['pregrado', 'universitario'],
        'emprendedor' => ['independiente', 'emprendimiento'],
        'empleado' => ['empleada', 'trabaja', 'dependiente'],
        'soltero' => ['soltera'], 'casado' => ['casada'], 'separado' => ['separada'], 'divorciado' => ['divorciada'], 'viudo' => ['viuda'],
    ];

    private function date(mixed $raw): string
    {
        if ($raw instanceof DateTimeInterface) {
            $d = CarbonImmutable::instance($raw);
        } elseif (is_numeric($raw) && (float) $raw > 1000 && (float) $raw < 80000) {
            $d = CarbonImmutable::create(1899, 12, 30)->addDays((int) $raw); // número de serie de Excel
        } else {
            $s = trim((string) $raw);
            $s = preg_replace('/\s+\d{1,2}:\d{2}(:\d{2})?$/', '', $s); // «15/03/2001 00:00»
            if (preg_match('/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2})$/', $s, $m)) {
                $s = $m[1].'/'.$m[2].'/'.((int) $m[3] > 30 ? '19' : '20').$m[3];
            }
            $d = null;
            foreach (['d/m/Y', 'd-m-Y', 'd.m.Y', 'Y-m-d', 'Y/m/d'] as $f) {
                $p = \DateTimeImmutable::createFromFormat('!'.$f, $s);
                $e = \DateTimeImmutable::getLastErrors();
                if ($p && (! $e || ($e['warning_count'] === 0 && $e['error_count'] === 0))) {
                    $d = CarbonImmutable::instance($p);
                    break;
                }
            }
            if (! $d) {
                throw new \InvalidArgumentException('«'.$s.'» no es una fecha válida. Use dd/mm/aaaa.');
            }
        }
        if ($d->year < 1920 || $d->year > 2100) {
            throw new \InvalidArgumentException('La fecha '.$d->format('d/m/Y').' está fuera de rango.');
        }

        return $d->toDateString();
    }

    private static function ageRange(?string $birth, ?CarbonImmutable $ref): ?string
    {
        if (! $birth || ! $ref) {
            return null;
        }
        $age = CarbonImmutable::parse($birth)->diffInYears($ref);
        $age = (int) floor($age);

        return match (true) {
            $age < 20 => 'm20', $age < 25 => '20_24', $age < 30 => '25_29', $age < 35 => '30_34', $age < 40 => '35_39', default => '40m',
        };
    }

    private static function years(?string $since, ?CarbonImmutable $ref): ?int
    {
        if (! $since || ! $ref) {
            return null;
        }

        return max(0, min(80, (int) floor(CarbonImmutable::parse($since)->diffInYears($ref))));
    }

    private function toAttributes(string $entity, array $v, ?AcademicPeriod $period, ?CarbonImmutable $ref): array
    {
        $person = [
            'document_type' => $v['tipo_documento'], 'document_number' => $v['numero_documento'], 'full_name' => $v['nombres_apellidos'],
            'email' => $v['correo'], 'phone' => $v['telefono'],
        ];
        $key = Pseudonym::key($v['numero_documento']);

        return match ($entity) {
            'estudiantes' => $person + [
                'period_id' => $period->id, 'student_key' => $key, 'program_id' => $v['programa'], 'cat_id' => $v['cat'],
                'enrollment_status' => $v['estado_matricula'] ?? 'matriculado', 'is_new' => (bool) $v['primer_ingreso'], 'semester' => $v['semestre'],
                'sex' => $v['sexo'], 'age_range' => self::ageRange($v['fecha_nacimiento'], $ref), 'marital_status' => $v['estado_civil'],
                'stratum' => $v['estrato'], 'residence_zone' => $v['zona'], 'residence_municipality_id' => $v['municipio_residencia'],
                'special_population' => $v['poblacion_especial'] ?: null, 'academic_average' => $v['promedio'],
                'is_student_representative' => (bool) $v['representante_estudiantil'],
            ],
            'docentes' => $person + [
                'period_id' => $period->id, 'teacher_key' => $key, 'contract_type' => $v['vinculacion'], 'max_education' => $v['nivel_formacion'],
                'category' => $v['categoria'], 'sex' => $v['sexo'], 'age_range' => self::ageRange($v['fecha_nacimiento'], $ref),
                'seniority_years' => self::years($v['fecha_vinculacion'], $ref), 'dependency_id' => $v['departamento_academico'],
                'in_research_group' => (bool) $v['grupo_investigacion'], 'in_research_seedbed' => (bool) $v['semillero'], 'teaching_seminar' => (bool) $v['seminario_docencia'],
                '_assignment' => ['cat_id' => $v['cat'], 'program_id' => $v['programa'], 'courses' => $v['cursos'] ?? 0, 'hours' => $v['horas']],
            ],
            'graduados' => $person + [
                'graduate_key' => $key, 'program_id' => $v['programa'], 'cat_id' => $v['cat'], 'graduation_date' => $v['fecha_grado'],
                'period_id' => $this->periodForDate($v['fecha_grado']), 'cohort_period_id' => $v['periodo_ingreso'], 'degree_option' => $v['opcion_grado'],
                'sex' => $v['sexo'], 'final_average' => $v['promedio_final'], 'employment_status' => $v['situacion_laboral'],
            ],
            'personal' => $person + [
                'period_id' => $period->id, 'staff_key' => $key, 'staff_type' => $v['condicion'], 'contract_type' => $v['tipo_vinculacion'],
                'position' => $v['cargo'], 'grade' => $v['grado'], 'main_function' => $v['funcion_principal'], 'contract_number' => $v['numero_contrato'],
                'contract_start' => $v['inicio_contrato'], 'contract_end' => $v['fin_contrato'], 'dependency_id' => $v['dependencia'], 'cat_id' => $v['cat'],
                'sex' => $v['sexo'], 'age_range' => self::ageRange($v['fecha_nacimiento'], $ref), 'education_level' => $v['nivel_formacion'],
                'seniority_years' => self::years($v['fecha_vinculacion'], $ref), 'trained_in_period' => (bool) $v['capacitado'],
            ],
        };
    }

    private function periodForDate(string $date): int
    {
        $d = CarbonImmutable::parse($date);
        $code = $d->year.'-'.($d->month <= 6 ? 1 : 2);
        $id = $this->lookups['periods'][self::norm($code)] ?? null;
        if (! $id) {
            throw new \InvalidArgumentException("No existe el semestre $code en el catálogo de períodos (fecha de grado ".$d->format('d/m/Y').').');
        }

        return $id;
    }

    private function duplicateKey(string $entity, array $a): string
    {
        return match ($entity) {
            'estudiantes' => $a['student_key'].'|'.$a['program_id'],
            'docentes' => $a['teacher_key'].'|'.$a['_assignment']['cat_id'].'|'.$a['_assignment']['program_id'],
            'graduados' => $a['graduate_key'].'|'.$a['program_id'],
            'personal' => $a['staff_key'],
        };
    }

    private function duplicateText(string $entity): string
    {
        return match ($entity) {
            'estudiantes' => 'misma persona en el mismo programa',
            'docentes' => 'mismo docente en el mismo CAT y programa',
            'graduados' => 'misma persona con el mismo título',
            'personal' => 'misma persona dos veces en el semestre',
        };
    }

    // ------------------------------------------------------------------ catálogos

    public static function norm(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = strtr($s, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n', 'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u']);
        $s = preg_replace('/[^a-z0-9]+/', '_', $s);

        return trim($s, '_');
    }

    private function buildLookups(): void
    {
        if ($this->lookups) {
            return;
        }
        $add = function (array &$m, ?string $k, int $id) {
            if ($k === null || $k === '') {
                return;
            }
            $k = self::norm($k);
            $m[$k] = isset($m[$k]) && $m[$k] !== $id ? false : $id; // false = ambiguo
        };
        $p = [];
        foreach (Program::get(['id', 'name', 'slug', 'snies_code']) as $r) {
            $add($p, $r->name, $r->id);
            $add($p, $r->slug, $r->id);
            $add($p, $r->snies_code, $r->id);
        }
        $c = [];
        foreach (Cat::with('municipality:id,name')->get(['id', 'name', 'slug', 'municipality_id']) as $r) {
            $add($c, $r->name, $r->id);
            $add($c, preg_replace('/^cat\s+/iu', '', $r->name), $r->id);
            $add($c, $r->slug, $r->id);
            $add($c, preg_replace('/^cat-/', '', $r->slug), $r->id);
            $add($c, $r->municipality?->name, $r->id);
        }
        $m = [];
        foreach (Municipality::get(['id', 'name', 'code']) as $r) {
            $add($m, $r->name, $r->id);
            $add($m, $r->code, $r->id);
        }
        $d = [];
        foreach (Dependency::get(['id', 'name', 'code']) as $r) {
            $add($d, $r->name, $r->id);
            $add($d, $r->code, $r->id);
        }
        $per = [];
        foreach (AcademicPeriod::get(['id', 'code']) as $r) {
            $add($per, $r->code, $r->id);
        }
        $this->lookups = ['programs' => $p, 'cats' => $c, 'municipalities' => $m, 'dependencies' => $d, 'periods' => $per];
    }

    private function find(string $type, mixed $value): ?int
    {
        $raw = is_float($value) ? (string) (int) $value : (string) $value;

        return ($this->lookups[$type][self::norm($raw)] ?? null) ?: null;
    }

    // ------------------------------------------------------------------ guardar

    /** Guarda las filas válidas. Las bases por semestre reemplazan la carga anterior del mismo semestre. */
    public function import(array $def, array $valid, array $summary, ?AcademicPeriod $period, User $user, string $fileName): RecordImport
    {
        return DB::transaction(function () use ($def, $valid, $summary, $period, $user, $fileName) {
            $model = $def['model'];
            $table = (new $model)->getTable();
            if ($def['by_period']) {
                RecordImport::where('entity', $table)->where('period_id', $period->id)->where('status', 'cargado')->update(['status' => 'reemplazado']);
                $model::where('period_id', $period->id)->delete(); // docentes: sus asignaciones se borran en cascada
            }
            $imp = RecordImport::create([
                'entity' => $table, 'period_id' => $period?->id, 'file_name' => mb_substr($fileName, 0, 255),
                'rows_total' => $summary['rows_total'], 'rows_valid' => count($valid), 'rows_error' => $summary['error_rows'],
                'errors' => array_slice($summary['errors'], 0, 100), 'status' => 'cargado', 'created_by' => $user->id,
            ]);
            $teachers = [];
            foreach ($valid as $v) {
                $a = $v['attrs'] + ['import_id' => $imp->id];
                if ($def['entity'] === 'docentes') {
                    $asg = $a['_assignment'];
                    unset($a['_assignment']);
                    $t = $teachers[$a['teacher_key']] ??= Teacher::create($a);
                    TeacherAssignment::create($asg + ['teacher_id' => $t->id]);
                } elseif ($def['entity'] === 'graduados') {
                    $g = Graduation::firstOrNew(['graduate_key' => $a['graduate_key'], 'program_id' => $a['program_id']]);
                    $g->fill($a)->save();
                } else {
                    $model::create($a);
                }
            }
            if ($def['entity'] === 'docentes') {
                $imp->update(['rows_valid' => count($teachers)]);
            }

            return $imp;
        });
    }

    /** Deshace una carga: elimina los registros que creó. */
    public function undo(array $def, RecordImport $imp): void
    {
        DB::transaction(function () use ($def, $imp) {
            $def['model']::where('import_id', $imp->id)->delete();
            $imp->update(['status' => 'anulado']);
        });
    }
}
