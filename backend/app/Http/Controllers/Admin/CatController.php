<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class CatController extends ResourceController
{
    protected string $model = \App\Models\Cat::class;
    protected string $viewPermission = 'cats.edit';
    protected string $editPermission = 'cats.edit';
    protected array $with = ['municipality.department', 'photo', 'sites', 'facilities', 'events', 'coverage:id,name'];
    protected ?string $publishPermission = 'entities.publish';
    protected ?string $workflowField = 'publication_status';
    protected array $searchable = ['name'];
    protected array $filterable = ['status', 'municipality_id'];
    protected string $orderBy = 'name';
    protected string $orderDir = 'asc';
    protected bool $scoped = true;
    protected ?string $slugFrom = 'name';

    protected function rules(Request $request, ?Model $item): array
    {
        return [
            'name' => 'required|string|max:255',
            'municipality_id' => 'required|exists:municipalities,id',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-5,14',
            'longitude' => 'nullable|numeric|between:-82,-66',
            'coords_verified' => 'boolean',
            'history' => 'nullable|string|max:50000',
            'phone' => 'nullable|string|max:60',
            'email' => 'nullable|email|max:255',
            'schedule' => 'nullable|string|max:2000',
            'manager_name' => 'nullable|string|max:255',
            'manager_public' => 'boolean',
            'opened_on' => 'nullable|date',
            'status' => 'required|in:activo,inactivo,reactivado',
            'photo_file_id' => 'nullable|exists:files,id',
            'dependency_id' => 'nullable|exists:dependencies,id',
            'coverage_ids' => 'array',
            'coverage_ids.*' => 'exists:municipalities,id',
            'sites' => 'array',
            'sites.*.name' => 'required|string|max:255',
            'sites.*.ownership' => 'required|in:publica,privada,propia',
            'sites.*.address' => 'nullable|string|max:255',
            'sites.*.is_active' => 'boolean',
            'facilities' => 'array',
            'facilities.*.facility_type' => 'required|in:aula,laboratorio,sala_computo,biblioteca,auditorio,deportivo,bienestar,equipos,conectividad',
            'facilities.*.quantity' => 'required|integer|min:0',
            'facilities.*.capacity' => 'nullable|integer|min:0',
            'facilities.*.notes' => 'nullable|string|max:255',
            'events' => 'array',
            'events.*.event_type' => 'required|in:apertura,cierre,reactivacion,hito',
            'events.*.event_date' => 'required|date',
            'events.*.description' => 'nullable|string|max:255',
            'events.*.act_reference' => 'nullable|string|max:255',
        ];
    }

    protected function prepare(Request $request, array $data, ?Model $item): array
    {
        unset($data['coverage_ids'], $data['sites'], $data['facilities'], $data['events']);

        return parent::prepare($request, $data, $item);
    }

    protected function afterSave(Request $request, Model $item): void
    {
        if ($request->has('coverage_ids')) {
            $item->coverage()->sync($request->input('coverage_ids', []));
        }
        foreach (['sites' => 'sites', 'facilities' => 'facilities', 'events' => 'events'] as $key => $rel) {
            if ($request->has($key)) {
                $item->{$rel}()->delete();
                foreach ($request->input($key, []) as $row) {
                    $item->{$rel}()->create(\Illuminate\Support\Arr::except($row, ['id', 'cat_id', 'created_at', 'updated_at']));
                }
            }
        }
    }
}
