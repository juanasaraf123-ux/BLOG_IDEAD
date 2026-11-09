<?php

namespace App\Services;

use App\Models\AcademicPeriod;
use App\Models\Cat;
use App\Models\ClassifierItem;
use App\Models\DataSubmission;
use App\Models\Department;
use App\Models\EducationLevel;
use App\Models\Indicator;
use App\Models\IndicatorValue;
use App\Models\KnowledgeArea;
use App\Models\Municipality;
use App\Models\Program;
use App\Models\Review;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

/**
 * Flujo de carga de datos de indicadores:
 * borrador → enviado → (devuelto → borrador) → aprobado → publicado → reemplazado/retirado.
 *
 * - Solo se editan lotes en borrador o devueltos.
 * - Quien envió el lote no puede aprobarlo (separación de funciones).
 * - Al publicar se aplica la supresión de celdas pequeñas y, si el lote reemplaza a otro, el anterior pasa a `reemplazado`.
 */
class SubmissionService
{
    /** Columnas de la plantilla de importación (Excel/CSV). Los valores de dimensión se identifican por código. */
    public const TEMPLATE_COLUMNS = [
        'periodo' => 'Código del período (p. ej. 2026-1, 2026)',
        'programa' => 'Código SNIES o slug del programa (opcional)',
        'cat' => 'Slug del CAT (opcional)',
        'departamento' => 'Código DANE de 2 dígitos (opcional)',
        'municipio' => 'Código DANE de 5 dígitos (opcional)',
        'nivel' => 'Código del nivel de formación (opcional)',
        'area' => 'Código del área de conocimiento (opcional)',
        'categoria' => 'Código del ítem del clasificador del indicador (opcional)',
        'valor' => 'Valor numérico (punto decimal)',
        'nota' => 'Observación (opcional)',
    ];

    private const DIM_MAP = [
        'programa' => 'program_id', 'cat' => 'cat_id', 'departamento' => 'department_id', 'municipio' => 'municipality_id',
        'nivel' => 'level_id', 'area' => 'area_id', 'categoria' => 'classifier_item_id',
    ];

    private const DIM_KEY = [
        'program_id' => 'program', 'cat_id' => 'cat', 'department_id' => 'department', 'municipality_id' => 'municipality',
        'level_id' => 'level', 'area_id' => 'area', 'classifier_item_id' => 'classifier',
    ];

    public function editable(DataSubmission $s): bool
    {
        return in_array($s->status, ['borrador', 'devuelto'], true);
    }

    /**
     * Reemplaza todos los valores del lote tras validarlos.
     *
     * @param  array<int,array<string,mixed>>  $values  filas con period_id, *_id de dimensiones, value, note
     */
    public function replaceValues(DataSubmission $s, array $values): void
    {
        if (! $this->editable($s)) {
            throw ValidationException::withMessages(['status' => 'Solo se pueden modificar lotes en borrador o devueltos.']);
        }
        $indicator = Indicator::findOrFail($s->indicator_id); // carga completa (la relación puede venir con columnas parciales)
        $rows = [];
        $seen = [];
        foreach (array_values($values) as $i => $v) {
            $row = $this->validateRow($indicator, $v, $i + 1);
            $hash = IndicatorValue::hashDims($row);
            if (isset($seen[$hash])) {
                throw ValidationException::withMessages(["values.$i" => 'Fila '.($i + 1).': combinación de período y dimensiones repetida (también en la fila '.$seen[$hash].').']);
            }
            $seen[$hash] = $i + 1;
            $row['dims_hash'] = $hash;
            $row['submission_id'] = $s->id;
            $rows[] = $row;
        }

        DB::transaction(function () use ($s, $rows) {
            $s->values()->delete();
            foreach (array_chunk($rows, 500) as $chunk) {
                IndicatorValue::insert($chunk);
            }
            $s->touch();
        });
    }

    private function validateRow(Indicator $indicator, array $v, int $line): array
    {
        $err = fn (string $m) => throw ValidationException::withMessages(['values' => "Fila $line: $m"]);
        $allowed = $indicator->allowed_dimensions ?? [];

        if (empty($v['period_id']) || ! AcademicPeriod::whereKey($v['period_id'])->exists()) {
            $err('período inválido.');
        }
        if (! isset($v['value']) || $v['value'] === '' || ! is_numeric($v['value'])) {
            $err('el valor debe ser numérico.');
        }
        $value = (float) $v['value'];
        if ($value < 0 && $indicator->value_type !== 'number') {
            $err('el valor no puede ser negativo.');
        }
        if ($indicator->value_type === 'percent' && $value > 100) {
            $err('un porcentaje no puede superar 100.');
        }

        $row = ['period_id' => (int) $v['period_id'], 'value' => $value, 'note' => isset($v['note']) ? mb_substr((string) $v['note'], 0, 255) : null, 'is_suppressed' => false];
        $models = [
            'program_id' => Program::class, 'cat_id' => Cat::class, 'department_id' => Department::class, 'municipality_id' => Municipality::class,
            'level_id' => EducationLevel::class, 'area_id' => KnowledgeArea::class, 'classifier_item_id' => ClassifierItem::class,
        ];
        foreach (IndicatorValue::DIMENSIONS as $col) {
            $id = $v[$col] ?? null;
            if ($id === null || $id === '') {
                $row[$col] = null;

                continue;
            }
            if (! in_array(self::DIM_KEY[$col], $allowed, true)) {
                $err('el indicador no admite la desagregación «'.self::DIM_KEY[$col].'».');
            }
            if (! $models[$col]::whereKey($id)->exists()) {
                $err('valor de «'.self::DIM_KEY[$col].'» inexistente.');
            }
            if ($col === 'classifier_item_id' && ClassifierItem::find($id)->classifier_id !== $indicator->classifier_id) {
                $err('la categoría no pertenece al clasificador del indicador.');
            }
            $row[$col] = (int) $id;
        }

        return $row;
    }

    /** Convierte un archivo Excel/CSV de la plantilla en filas de valores (resolviendo códigos a identificadores). */
    public function parseImport(Indicator $indicator, string $path, string $ext): array
    {
        if ($ext === 'csv') {
            $first = (string) fgets(fopen($path, 'r'));
            $delimiter = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
            $reader = new CsvReader(new \OpenSpout\Reader\CSV\Options(FIELD_DELIMITER: $delimiter));
        } else {
            $reader = new XlsxReader;
        }
        $reader->open($path);
        $header = null;
        $out = [];
        $line = 0;
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $line++;
                $cells = array_map(fn ($c) => is_string($c) ? trim($c) : $c, $row->toArray());
                if ($header === null) {
                    $header = array_map(fn ($h) => mb_strtolower(trim(str_replace("\u{FEFF}", '', (string) $h))), $cells);
                    if (! in_array('periodo', $header, true) || ! in_array('valor', $header, true)) {
                        throw ValidationException::withMessages(['file' => 'La plantilla debe incluir al menos las columnas «periodo» y «valor».']);
                    }

                    continue;
                }
                if (count(array_filter($cells, fn ($c) => $c !== '' && $c !== null)) === 0) {
                    continue;
                }
                $data = [];
                foreach ($header as $i => $h) {
                    $data[$h] = $cells[$i] ?? null;
                }
                $out[] = $this->resolveCodes($indicator, $data, $line);
                if (count($out) > 20000) {
                    throw ValidationException::withMessages(['file' => 'El archivo supera 20.000 filas.']);
                }
            }
            break; // solo la primera hoja
        }
        $reader->close();

        return $out;
    }

    private function resolveCodes(Indicator $indicator, array $d, int $line): array
    {
        $err = fn (string $m) => throw ValidationException::withMessages(['file' => "Fila $line: $m"]);
        $period = AcademicPeriod::where('code', (string) ($d['periodo'] ?? ''))->first() ?? $err('período «'.($d['periodo'] ?? '').'» no existe.');
        $row = ['period_id' => $period->id, 'value' => is_string($d['valor'] ?? null) ? str_replace(',', '.', $d['valor']) : ($d['valor'] ?? null), 'note' => $d['nota'] ?? null];
        foreach (self::DIM_MAP as $col => $dim) {
            $code = isset($d[$col]) ? trim((string) $d[$col]) : '';
            if ($code === '') {
                continue;
            }
            $id = match ($col) {
                'programa' => Program::where('snies_code', $code)->orWhere('slug', $code)->value('id'),
                'cat' => Cat::where('slug', $code)->value('id'),
                'departamento' => Department::where('code', str_pad($code, 2, '0', STR_PAD_LEFT))->value('id'),
                'municipio' => Municipality::where('code', str_pad($code, 5, '0', STR_PAD_LEFT))->value('id'),
                'nivel' => EducationLevel::where('code', $code)->value('id'),
                'area' => KnowledgeArea::where('code', $code)->value('id'),
                'categoria' => ClassifierItem::where('classifier_id', $indicator->classifier_id)->where('code', $code)->value('id'),
            };
            if (! $id) {
                $err("«$col» con código «$code» no existe.");
            }
            $row[$dim] = $id;
        }

        return $row;
    }

    public function submit(DataSubmission $s, User $user, ?string $comment = null): void
    {
        if (! $this->editable($s)) {
            throw ValidationException::withMessages(['status' => 'El lote no está en un estado que permita enviarlo.']);
        }
        if ($s->values()->count() === 0) {
            throw ValidationException::withMessages(['values' => 'El lote no tiene valores registrados.']);
        }
        $s->update(['status' => 'enviado', 'submitted_by' => $user->id, 'submitted_at' => now()]);
        $this->review($s, $user, 'enviado', $comment);
    }

    public function decide(DataSubmission $s, User $user, string $decision, ?string $comment): void
    {
        if ($s->status !== 'enviado') {
            throw ValidationException::withMessages(['status' => 'Solo se revisan lotes enviados.']);
        }
        if ($s->submitted_by === $user->id || $s->created_by === $user->id) {
            throw ValidationException::withMessages(['status' => 'Separación de funciones: quien registra o envía un lote no puede revisarlo.']);
        }
        if ($decision === 'devuelto' && blank($comment)) {
            throw ValidationException::withMessages(['comment' => 'Indique el motivo de la devolución.']);
        }
        $s->update($decision === 'aprobado'
            ? ['status' => 'aprobado', 'approved_by' => $user->id, 'approved_at' => now()]
            : ['status' => 'devuelto']);
        $this->review($s, $user, $decision, $comment);
    }

    public function publish(DataSubmission $s, User $user): void
    {
        if ($s->status !== 'aprobado') {
            throw ValidationException::withMessages(['status' => 'Solo se publican lotes aprobados.']);
        }
        $indicator = Indicator::findOrFail($s->indicator_id);
        if (! $indicator->isPublishable()) {
            throw ValidationException::withMessages(['status' => 'El indicador no está autorizado para publicación pública. Los datos quedan disponibles solo en el panel.']);
        }
        DB::transaction(function () use ($s, $user, $indicator) {
            $k = $indicator->min_cell_size ?? (in_array($indicator->publication_level, ['AGR', 'AGR_S'], true) ? (int) Settings::get('min_cell_size', 5) : null);
            if ($k && $indicator->value_type === 'count') {
                $s->values()->where('value', '>', 0)->where('value', '<', $k)->update(['is_suppressed' => true]);
            }
            if ($s->supersedes_id) {
                DataSubmission::whereKey($s->supersedes_id)->where('status', 'publicado')->update(['status' => 'reemplazado']);
            }
            $s->update(['status' => 'publicado', 'published_by' => $user->id, 'published_at' => now()]);
            $this->review($s, $user, 'publicado', null);
        });
        Audit::log('indicator.publish', $s, ['indicator' => $indicator->code]);
    }

    public function unpublish(DataSubmission $s, User $user, ?string $comment): void
    {
        if ($s->status !== 'publicado') {
            throw ValidationException::withMessages(['status' => 'El lote no está publicado.']);
        }
        $s->update(['status' => 'retirado']);
        $this->review($s, $user, 'despublicado', $comment);
        Audit::log('indicator.unpublish', $s, ['indicator' => Indicator::find($s->indicator_id)->code]);
    }

    private function review(DataSubmission $s, User $user, string $decision, ?string $comment): void
    {
        Review::create([
            'reviewable_type' => 'submission', 'reviewable_id' => $s->id, 'reviewer_id' => $user->id,
            'decision' => $decision, 'comment' => $comment, 'created_at' => now(),
        ]);
    }
}
