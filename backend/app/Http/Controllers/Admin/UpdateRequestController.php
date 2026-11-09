<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Solicitudes de actualización: quien revisa (Director) solicita a una dependencia actualizar un indicador o información;
 * los coordinadores ven las de sus dependencias y registran la respuesta y el lote que las atiende.
 */
class UpdateRequestController extends ResourceController
{
    protected string $model = \App\Models\UpdateRequest::class;
    protected string $viewPermission = 'indicators.submit';
    protected string $editPermission = 'indicators.review';
    protected array $with = ['indicator:id,code,name', 'dependency:id,code,name', 'period:id,code', 'requester:id,name', 'attendant:id,name'];
    protected array $searchable = ['title', 'description'];
    protected array $filterable = ['status', 'dependency_id', 'indicator_id'];
    protected string $orderBy = 'due_date';
    protected string $orderDir = 'asc';
    protected bool $scoped = true;

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'indicator_id' => 'nullable|exists:indicators,id',
            'dependency_id' => 'required|exists:dependencies,id',
            'period_id' => 'nullable|exists:academic_periods,id',
            'due_date' => 'nullable|date',
            'status' => 'required|in:abierta,en_proceso,atendida,cancelada',
            'submission_id' => 'nullable|exists:data_submissions,id',
            'response' => 'nullable|string|max:5000',
        ];
    }

    protected function prepare(Request $request, array $data, ?Model $item): array
    {
        if (! $item) {
            $data['requested_by'] = $request->user()->id;
        }
        if (($data['status'] ?? null) === 'atendida' && (! $item || $item->status !== 'atendida')) {
            $data['attended_by'] = $request->user()->id;
            $data['attended_at'] = now();
        }

        return $data;
    }

    /** Los coordinadores (sin permiso de revisión) solo pueden responder: estado, lote y respuesta. */
    public function update(Request $request, int $id)
    {
        $u = $request->user();
        if (! $u->hasPermission('indicators.review') && $u->hasPermission('indicators.submit')) {
            $item = $this->query($request)->findOrFail($id);
            $data = $request->validate([
                'status' => 'required|in:en_proceso,atendida',
                'submission_id' => 'nullable|exists:data_submissions,id',
                'response' => 'nullable|string|max:5000',
            ]);
            $item->update($this->prepare($request, $data, $item));

            return $this->show($request, $item->id);
        }

        return parent::update($request, $id);
    }
}
