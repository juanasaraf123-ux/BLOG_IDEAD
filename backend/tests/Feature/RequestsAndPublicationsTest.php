<?php

namespace Tests\Feature;

use App\Models\Dependency;
use App\Models\Publication;

class RequestsAndPublicationsTest extends IdeadTestCase
{
    public function test_director_requests_and_dependency_responds(): void
    {
        $dir = $this->userWithRole('director');
        $coord = $this->userWithRole('coordinador', ['DARCA']);
        $other = $this->userWithRole('coordinador', ['PRIDEAD']);
        $darca = Dependency::where('code', 'DARCA')->value('id');

        $id = $this->actingAs($dir)->postJson('/api/admin/v1/update-requests', [
            'title' => 'Actualizar matrícula 2026-2', 'dependency_id' => $darca, 'status' => 'abierta', 'due_date' => now()->addDays(10)->toDateString(),
        ])->assertCreated()->json('id');

        // La dependencia destinataria la ve y responde; no puede crear solicitudes ni cambiar el asunto.
        $this->actingAs($coord)->getJson('/api/admin/v1/update-requests')->assertOk()->assertJsonPath('total', 1);
        $this->actingAs($coord)->postJson('/api/admin/v1/update-requests', ['title' => 'x', 'dependency_id' => $darca, 'status' => 'abierta'])->assertForbidden();
        $r = $this->actingAs($coord)->putJson("/api/admin/v1/update-requests/$id", ['title' => 'Cambiado', 'status' => 'atendida', 'response' => 'Cargado en el lote'])->assertOk();
        $this->assertSame('Actualizar matrícula 2026-2', $r->json('title'));
        $this->assertSame('atendida', $r->json('status'));
        $this->assertSame($coord->id, $r->json('attended_by'));

        // Otra dependencia no la ve.
        $this->actingAs($other)->getJson('/api/admin/v1/update-requests')->assertOk()->assertJsonPath('total', 0);
    }

    public function test_only_published_publications_are_public(): void
    {
        Publication::create(['slug' => 'a', 'title' => 'Artículo publicado', 'publication_type' => 'articulo', 'year' => 2026, 'publication_status' => 'publicado']);
        Publication::create(['slug' => 'b', 'title' => 'Libro en borrador', 'publication_type' => 'libro', 'year' => 2026]);
        $titles = collect($this->getJson('/api/public/v1/publications')->assertOk()->json())->pluck('title')->all();
        $this->assertSame(['Artículo publicado'], $titles);
        $this->getJson('/api/public/v1/search?q=borrador')->assertJsonCount(0, 'results');
    }
}
