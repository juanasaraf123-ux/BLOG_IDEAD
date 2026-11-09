<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Indicator;
use App\Models\PettyCashExpense;
use App\Services\IndicatorQuery;
use App\Support\Audit;
use App\Support\TableExporter;
use Illuminate\Http\Request;

/**
 * Informes internos: incluyen datos aprobados aún no publicados. Respetan permisos por rol:
 * el módulo de gestión financiera exige reports.financial.view; los coordinadores solo exportan sus dependencias.
 */
class ReportController extends Controller
{
    public function indicators(Request $request)
    {
        $u = $request->user();
        abort_unless($u->hasPermission('reports.internal.export'), 403);
        $data = $request->validate([
            'module_id' => 'nullable|exists:indicator_categories,id',
            'indicator_id' => 'nullable|exists:indicators,id',
            'format' => 'nullable|in:csv,xlsx',
            'period' => 'nullable', 'year' => 'nullable|integer', 'program' => 'nullable|integer', 'cat' => 'nullable|integer',
            'department' => 'nullable|integer', 'level' => 'nullable|integer',
        ]);
        $q = Indicator::with('module')->orderBy('module_id')->orderBy('sort');
        if (! empty($data['indicator_id'])) {
            $q->whereKey($data['indicator_id']);
        } elseif (! empty($data['module_id'])) {
            $q->where('module_id', $data['module_id']);
        }
        if (! $u->hasPermission('reports.financial.view')) {
            $q->whereHas('module', fn ($m) => $m->where('number', '!=', 11));
        }
        if (! $u->hasPermission('scope.all_dependencies')) {
            $q->whereIn('responsible_dependency_id', $u->dependencyIds());
        }
        $svc = new IndicatorQuery(internal: true);
        $rows = [];
        foreach ($q->get() as $i) {
            $res = $svc->run($i, $data);
            array_push($rows, ...TableExporter::indicatorRows($i->code, $i->name, $i->unit, $res));
        }
        Audit::log('report.export', null, $data);

        return TableExporter::download('informe_indicadores_'.now()->format('Ymd_His'), TableExporter::INDICATOR_HEADER, $rows, $data['format'] ?? 'xlsx', [
            ['Informe interno de indicadores IDEAD — incluye datos aprobados no publicados'],
            ['Generado', now()->format('Y-m-d H:i'), 'por', $u->name],
        ]);
    }

    public function pettyCash(Request $request)
    {
        abort_unless($request->user()->hasPermission('petty_cash.view'), 403);
        $q = PettyCashExpense::with('budget')->orderBy('expense_date');
        if ($request->filled('budget_id')) {
            $q->where('budget_id', $request->query('budget_id'));
        }
        $rows = $q->get()->map(fn ($e) => [$e->budget?->year, $e->budget?->name, $e->expense_date?->format('Y-m-d'), $e->concept, $e->provider, $e->invoice_number, $e->amount, $e->status])->all();
        Audit::log('report.petty_cash', null);

        return TableExporter::download('caja_menor_'.now()->format('Ymd'), ['vigencia', 'presupuesto', 'fecha', 'concepto', 'proveedor', 'factura', 'valor', 'estado'], $rows, $request->query('format', 'xlsx'));
    }
}
