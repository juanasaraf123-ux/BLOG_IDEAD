<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DataSubmission;
use App\Models\Indicator;
use App\Services\FileStorage;
use App\Services\SubmissionService;
use Illuminate\Http\Request;

/**
 * Lotes de datos de indicadores: registro manual, importación Excel/CSV, envío, revisión y publicación.
 * Los coordinadores solo operan sobre indicadores de sus dependencias.
 */
class SubmissionController extends Controller
{
    public function __construct(private SubmissionService $service) {}

    private function scoped(Request $request)
    {
        $u = $request->user();
        $q = DataSubmission::query()->with(['indicator:id,code,name,responsible_dependency_id', 'creator:id,name', 'submitter:id,name', 'approver:id,name']);
        if (! $u->hasPermission('scope.all_dependencies')) {
            $q->whereHas('indicator', fn ($i) => $i->whereIn('responsible_dependency_id', $u->dependencyIds()));
        }

        return $q;
    }

    private function canSee(Request $r): void
    {
        $u = $r->user();
        abort_unless($u->hasPermission('indicators.submit') || $u->hasPermission('indicators.review') || $u->hasPermission('indicators.publish') || $u->hasPermission('indicators.view_internal'), 403);
    }

    public function index(Request $request)
    {
        $this->canSee($request);
        $q = $this->scoped($request)->withCount('values')->orderByDesc('id');
        foreach (['status', 'indicator_id'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }

        return $q->paginate(min((int) $request->query('per_page', 25), 100));
    }

    public function show(Request $request, int $id)
    {
        $this->canSee($request);
        $s = $this->scoped($request)->with(['values', 'reviews.reviewer:id,name', 'indicator.classifier.items', 'sourceFile', 'publisher:id,name'])->findOrFail($id);

        return $s;
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->hasPermission('indicators.submit'), 403);
        $data = $request->validate([
            'indicator_id' => 'required|exists:indicators,id',
            'title' => 'nullable|string|max:255',
            'source_note' => 'nullable|string|max:2000',
            'supersedes_id' => 'nullable|exists:data_submissions,id',
        ]);
        $indicator = Indicator::findOrFail($data['indicator_id']);
        abort_unless($request->user()->inScope($indicator->responsible_dependency_id), 403, 'El indicador pertenece a otra dependencia.');
        if (! empty($data['supersedes_id'])) {
            abort_unless(DataSubmission::whereKey($data['supersedes_id'])->where('indicator_id', $indicator->id)->where('status', 'publicado')->exists(), 422, 'Solo se puede reemplazar un lote publicado del mismo indicador.');
        }
        $s = DataSubmission::create($data + ['created_by' => $request->user()->id, 'status' => 'borrador']);

        return response()->json($this->show($request, $s->id), 201);
    }

    private function ownEditable(Request $request, int $id): DataSubmission
    {
        abort_unless($request->user()->hasPermission('indicators.submit'), 403);

        return $this->scoped($request)->findOrFail($id);
    }

    public function update(Request $request, int $id)
    {
        $s = $this->ownEditable($request, $id);
        abort_unless($this->service->editable($s), 422, 'El lote no es editable en su estado actual.');
        $s->update($request->validate(['title' => 'nullable|string|max:255', 'source_note' => 'nullable|string|max:2000']));

        return $this->show($request, $id);
    }

    public function values(Request $request, int $id)
    {
        $s = $this->ownEditable($request, $id);
        $data = $request->validate(['values' => 'present|array|max:20000', 'values.*' => 'array']);
        $this->service->replaceValues($s, $data['values']);

        return $this->show($request, $id);
    }

    public function import(Request $request, int $id, FileStorage $files)
    {
        abort_unless($request->user()->hasPermission('indicators.import'), 403);
        $s = $this->ownEditable($request, $id);
        $request->validate(['file' => 'required|file']);
        $stored = $files->store($request->file('file'), 'data', 'local');
        $rows = $this->service->parseImport(Indicator::findOrFail($s->indicator_id), $files->absolutePath($stored), strtolower($request->file('file')->getClientOriginalExtension()));
        $this->service->replaceValues($s, $rows);
        $s->update(['source_file_id' => $stored->id]);

        return $this->show($request, $id);
    }

    public function submit(Request $request, int $id)
    {
        $s = $this->ownEditable($request, $id);
        $this->service->submit($s, $request->user(), $request->input('comment'));

        return $this->show($request, $id);
    }

    public function review(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('indicators.review'), 403);
        $s = $this->scoped($request)->findOrFail($id);
        $data = $request->validate(['decision' => 'required|in:aprobado,devuelto', 'comment' => 'nullable|string|max:2000']);
        $this->service->decide($s, $request->user(), $data['decision'], $data['comment'] ?? null);

        return $this->show($request, $id);
    }

    public function publish(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('indicators.publish'), 403);
        $s = $this->scoped($request)->findOrFail($id);
        $this->service->publish($s, $request->user());

        return $this->show($request, $id);
    }

    public function unpublish(Request $request, int $id)
    {
        abort_unless($request->user()->hasPermission('indicators.publish'), 403);
        $s = $this->scoped($request)->findOrFail($id);
        $this->service->unpublish($s, $request->user(), $request->input('comment'));

        return $this->show($request, $id);
    }

    public function destroy(Request $request, int $id)
    {
        $s = $this->ownEditable($request, $id);
        abort_unless($s->status === 'borrador', 422, 'Solo se eliminan lotes en borrador.');
        $s->delete();

        return response()->noContent();
    }
}
