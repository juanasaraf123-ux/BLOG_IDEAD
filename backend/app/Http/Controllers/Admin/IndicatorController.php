<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Indicator;
use App\Models\IndicatorModule;
use App\Services\IndicatorQuery;
use App\Services\SubmissionService;
use App\Support\Audit;
use Illuminate\Http\Request;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

/** Catálogo de indicadores (ficha técnica) y plantilla de carga. */
class IndicatorController extends Controller
{
    private function canView(Request $r): bool
    {
        $u = $r->user();

        return $u->hasPermission('indicators.view_internal') || $u->hasPermission('indicators.submit') || $u->hasPermission('indicators.catalog.manage') || $u->hasPermission('indicators.review');
    }

    public function index(Request $request)
    {
        abort_unless($this->canView($request), 403);
        $q = Indicator::with(['module:id,number,name', 'responsibleDependency:id,code', 'sources:id,code'])
            ->withCount(['submissions as pending_count' => fn ($s) => $s->where('status', 'enviado')])
            ->orderBy('module_id')->orderBy('sort');
        if ($request->filled('module_id')) {
            $q->where('module_id', $request->query('module_id'));
        }
        if ($t = $request->query('q')) {
            $q->where(fn ($w) => $w->where('name', 'like', "%$t%")->orWhere('code', 'like', "%$t%"));
        }
        if ($request->boolean('mine') && ! $request->user()->hasPermission('scope.all_dependencies')) {
            $q->whereIn('responsible_dependency_id', $request->user()->dependencyIds());
        }

        return $q->get()->map(function ($i) {
            $last = $i->submissions()->latest('id')->first(['id', 'status', 'updated_at', 'published_at']);

            return $i->toArray() + ['last_submission' => $last];
        });
    }

    public function modules()
    {
        return IndicatorModule::orderBy('number')->get();
    }

    public function show(Request $request, int $id)
    {
        abort_unless($this->canView($request), 403);
        $i = Indicator::with(['module', 'responsibleDependency', 'sources', 'classifier.items'])->findOrFail($id);
        $preview = (new IndicatorQuery(internal: true))->run($i, []);

        return $i->toArray() + ['internal_preview' => $preview];
    }

    public function update(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('indicators.catalog.manage'), 403);
        $i = Indicator::findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'unit' => 'required|string|max:30',
            'value_type' => 'required|in:count,percent,currency,ratio,number',
            'periodicity' => 'required|in:semestral,anual,vigencia,cohorte,eventual',
            'chart_type' => 'required|in:bar,line,stacked,distribution,kpi,table,map,progress',
            'group_by' => 'nullable|in:program,cat,department,municipality,level,area,classifier',
            'classifier_id' => 'nullable|exists:classifiers,id',
            'allowed_dimensions' => 'array',
            'allowed_dimensions.*' => 'in:program,cat,department,municipality,level,area,classifier',
            'publication_level' => 'required|in:PUB,AGR,AGR_S,MIX',
            'min_cell_size' => 'nullable|integer|between:2,50',
            'methodology' => 'nullable|string|max:10000',
            'methodology_status' => 'required|in:pendiente,validada',
            'responsible_dependency_id' => 'nullable|exists:dependencies,id',
            'observations' => 'nullable|string|max:5000',
            'publication_authorized' => 'boolean',
            'is_active' => 'boolean',
            'source_ids' => 'array',
            'source_ids.*' => 'exists:data_sources,id',
        ]);
        if (($data['methodology_status'] ?? '') === 'validada' && blank($data['methodology'] ?? null)) {
            abort(422, 'No se puede marcar la metodología como validada sin describirla.');
        }
        $i->update(collect($data)->except('source_ids')->all());
        if (array_key_exists('source_ids', $data)) {
            $i->sources()->sync($data['source_ids']);
        }
        if ($i->wasChanged('publication_authorized')) {
            Audit::log('indicator.authorization_changed', $i, ['authorized' => $i->publication_authorized]);
        }

        return $this->show($request, $i->id);
    }

    /** Plantilla Excel de carga para el indicador, con instrucciones y códigos válidos. */
    public function template(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('indicators.submit'), 403);
        $i = Indicator::with('classifier.items')->findOrFail($id);
        $tmp = tempnam(sys_get_temp_dir(), 'tpl').'.xlsx';
        $w = new Writer;
        $w->openToFile($tmp);
        $w->getCurrentSheet()->setName('datos');
        $w->addRow(Row::fromValues(array_keys(SubmissionService::TEMPLATE_COLUMNS)));
        $sheet = $w->addNewSheetAndMakeItCurrent();
        $sheet->setName('instrucciones');
        $w->addRow(Row::fromValues(['Indicador', $i->code.' — '.$i->name]));
        $w->addRow(Row::fromValues(['Desagregaciones admitidas', implode(', ', $i->allowed_dimensions ?? []) ?: 'ninguna (solo total por período)']));
        foreach (SubmissionService::TEMPLATE_COLUMNS as $col => $desc) {
            $w->addRow(Row::fromValues([$col, $desc]));
        }
        if ($i->classifier) {
            $w->addRow(Row::fromValues(['', '']));
            $w->addRow(Row::fromValues(['Códigos de «categoria» ('.$i->classifier->name.')', '']));
            foreach ($i->classifier->items as $it) {
                $w->addRow(Row::fromValues([$it->code, $it->label]));
            }
        }
        $w->close();

        return response()->download($tmp, 'plantilla_'.$i->code.'.xlsx')->deleteFileAfterSend();
    }
}
