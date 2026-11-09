<?php

namespace App\Services;

use App\Models\AcademicPeriod;
use App\Models\Indicator;
use App\Models\IndicatorValue;
use Illuminate\Support\Collection;

/**
 * Consulta de valores de indicadores con filtros, para el portal público y los informes.
 *
 * Reglas:
 * - Público: solo lotes en estado `publicado` de indicadores publicables; los datos de demostración
 *   solo se incluyen si IDEAD_DEMO_DATA=true.
 * - Interno (informes del panel): lotes `aprobado` o `publicado`.
 * - Si dos lotes vigentes contienen la misma combinación de dimensiones, prevalece el más reciente.
 * - Valores suprimidos (celdas pequeñas) se devuelven como null con `suppressed = true`.
 * - El total (KPI y tendencia) es la fila sin desagregaciones adicionales a las filtradas. Si no existe y el
 *   indicador es de conteo, se deriva sumando la desagregación principal y se marca como `derived`.
 *   Nunca se suman porcentajes, razones ni promedios.
 */
class IndicatorQuery
{
    public const FILTER_DIMS = [
        'program' => 'program_id', 'cat' => 'cat_id', 'department' => 'department_id',
        'municipality' => 'municipality_id', 'level' => 'level_id', 'area' => 'area_id', 'classifier' => 'classifier_item_id',
    ];

    public function __construct(private bool $internal = false) {}

    /** @param array<string,mixed> $filters claves: period, year, program, cat, department, municipality, level, area, classifier */
    public function run(Indicator $indicator, array $filters = []): array
    {
        $allowed = $indicator->allowed_dimensions ?? [];
        $active = [];
        $ignored = [];
        foreach (self::FILTER_DIMS as $key => $col) {
            if (! empty($filters[$key])) {
                if (in_array($key, $allowed, true)) {
                    $active[$col] = (int) $filters[$key];
                } else {
                    $ignored[] = $key;
                }
            }
        }

        $rows = $this->rows($indicator, $active, $filters);
        $periods = AcademicPeriod::whereIn('id', $rows->pluck('period_id')->unique())->orderBy('year')->orderBy('term')->get();
        $groupCol = $indicator->group_by ? (self::FILTER_DIMS[$indicator->group_by] ?? null) : null;
        $otherCols = array_values(array_diff(IndicatorValue::DIMENSIONS, array_keys($active)));
        $countable = in_array($indicator->value_type, ['count', 'currency'], true);
        $classifier = $indicator->classifier;
        // Solo se deriva un total sumando categorías si estas forman una partición (nunca para medidas distintas).
        $summable = $countable && ($groupCol !== 'classifier_item_id' || ($classifier && $classifier->is_partition));
        $firstPrefix = null;
        if ($groupCol === 'classifier_item_id' && $classifier) {
            $first = $classifier->items()->orderBy('sort')->value('label');
            $firstPrefix = $first && str_contains($first, ': ') ? strstr($first, ': ', true).': ' : null;
        }

        // Totales por período
        $trend = [];
        foreach ($periods as $p) {
            $pRows = $rows->where('period_id', $p->id);
            $total = $pRows->first(fn ($r) => $this->nullExcept($r, $otherCols, []));
            $derived = false;
            if (! $total && $summable && $groupCol && in_array($groupCol, $otherCols, true)) {
                $parts = $pRows->filter(fn ($r) => $r->{$groupCol} !== null && $this->nullExcept($r, $otherCols, [$groupCol])
                    && ($firstPrefix === null || str_starts_with((string) $r->classifierItem?->label, $firstPrefix)));
                if ($parts->isNotEmpty() && $parts->every(fn ($r) => ! $r->is_suppressed)) {
                    $total = (object) ['value' => $parts->sum('value'), 'is_suppressed' => false, 'note' => null];
                    $derived = true;
                }
            }
            if ($total) {
                $trend[] = [
                    'period' => $p->code, 'period_id' => $p->id,
                    'value' => $total->is_suppressed ? null : $total->value,
                    'suppressed' => (bool) $total->is_suppressed, 'derived' => $derived,
                ];
            }
        }

        $selectedPeriodId = $this->selectedPeriodId($filters, $periods);
        $breakdown = [];
        if ($groupCol && in_array($groupCol, $otherCols, true) && $selectedPeriodId) {
            $breakdown = $rows->where('period_id', $selectedPeriodId)
                ->filter(fn ($r) => $r->{$groupCol} !== null && $this->nullExcept($r, $otherCols, [$groupCol]))
                ->map(fn ($r) => [
                    'key' => $r->{$groupCol},
                    'label' => $this->label($r, $groupCol),
                    'value' => $r->is_suppressed ? null : $r->value,
                    'suppressed' => (bool) $r->is_suppressed,
                    'department_code' => $groupCol === 'department_id' ? $r->department?->code : null,
                ]);
            // Categorías de un clasificador conservan su orden natural (edad, estrato, semestre…); el resto se ordena por valor.
            $breakdown = ($groupCol === 'classifier_item_id'
                ? $breakdown->sortBy(fn ($b) => $classifier?->items->firstWhere('id', $b['key'])?->sort ?? 0)
                : $breakdown->sortByDesc('value'))->values()->all();
        }

        // Serie por grupo (para líneas múltiples o barras apiladas en el tiempo), limitada a 12 grupos.
        $seriesByGroup = [];
        if ($groupCol && in_array($groupCol, $otherCols, true)) {
            $groupRows = $rows->filter(fn ($r) => $r->{$groupCol} !== null && $this->nullExcept($r, $otherCols, [$groupCol]));
            $labels = $groupRows->map(fn ($r) => $this->label($r, $groupCol))->unique()->values();
            if ($labels->count() <= 12) {
                foreach ($periods as $p) {
                    $point = ['period' => $p->code];
                    foreach ($groupRows->where('period_id', $p->id) as $r) {
                        $point[$this->label($r, $groupCol)] = $r->is_suppressed ? null : $r->value;
                    }
                    if (count($point) > 1) {
                        $seriesByGroup[] = $point;
                    }
                }
            }
        }

        $kpi = null;
        foreach (array_reverse($trend) as $t) {
            if ($selectedPeriodId === null || $t['period_id'] === $selectedPeriodId) {
                $kpi = $t;
                break;
            }
        }

        return [
            'kpi' => $kpi,
            'trend' => $trend,
            'breakdown' => $breakdown,
            'series_by_group' => $seriesByGroup,
            'rows' => $rows->take(2000)->map(fn ($r) => $this->presentRow($r))->values()->all(),
            'row_count' => $rows->count(),
            'periods' => $periods->map(fn ($p) => ['id' => $p->id, 'code' => $p->code, 'year' => $p->year])->values()->all(),
            'selected_period' => $selectedPeriodId ? $periods->firstWhere('id', $selectedPeriodId)?->code : null,
            'ignored_filters' => $ignored,
            'last_published_at' => $rows->max('published_at'),
            'is_demo' => $rows->contains(fn ($r) => (bool) $r->is_demo),
        ];
    }

    /** Filas vigentes (deduplicadas por combinación de dimensiones). */
    public function rows(Indicator $indicator, array $activeDims = [], array $filters = []): Collection
    {
        $statuses = $this->internal ? ['aprobado', 'publicado'] : ['publicado'];
        $q = IndicatorValue::query()
            ->select('indicator_values.*', 'data_submissions.published_at', 'data_submissions.approved_at', 'data_submissions.is_demo')
            ->join('data_submissions', 'data_submissions.id', '=', 'indicator_values.submission_id')
            ->where('data_submissions.indicator_id', $indicator->id)
            ->whereIn('data_submissions.status', $statuses)
            ->with(['period', 'program', 'cat', 'department', 'municipality', 'level', 'area', 'classifierItem']);

        if (! $this->internal && ! config('idead.demo_data')) {
            $q->where('data_submissions.is_demo', false);
        }
        foreach ($activeDims as $col => $id) {
            $q->where('indicator_values.'.$col, $id);
        }
        if (! empty($filters['year'])) {
            $q->whereHas('period', fn ($p) => $p->where('year', (int) $filters['year']));
        }

        return $q->orderByDesc('data_submissions.published_at')->orderByDesc('data_submissions.approved_at')->orderByDesc('data_submissions.id')
            ->get()->unique('dims_hash')->values();
    }

    private function selectedPeriodId(array $filters, Collection $periods): ?int
    {
        if (! empty($filters['period'])) {
            $p = $periods->first(fn ($p) => (string) $p->id === (string) $filters['period'] || $p->code === $filters['period']);

            return $p?->id;
        }

        return $periods->last()?->id;
    }

    private function nullExcept(object $row, array $cols, array $except): bool
    {
        foreach ($cols as $c) {
            if (! in_array($c, $except, true) && $row->{$c} !== null) {
                return false;
            }
        }

        return true;
    }

    private function label(IndicatorValue $r, string $col): string
    {
        return match ($col) {
            'program_id' => $r->program?->name,
            'cat_id' => $r->cat?->name,
            'department_id' => $r->department?->name,
            'municipality_id' => $r->municipality?->name,
            'level_id' => $r->level?->name,
            'area_id' => $r->area?->name,
            'classifier_item_id' => $r->classifierItem?->label,
            default => '',
        } ?? '';
    }

    public function presentRow(IndicatorValue $r): array
    {
        return [
            'period' => $r->period?->code,
            'program' => $r->program?->name,
            'cat' => $r->cat?->name,
            'department' => $r->department?->name,
            'municipality' => $r->municipality?->name,
            'level' => $r->level?->name,
            'area' => $r->area?->name,
            'category' => $r->classifierItem?->label,
            'value' => $r->is_suppressed ? null : $r->value,
            'suppressed' => (bool) $r->is_suppressed,
            'note' => $r->note,
        ];
    }
}
