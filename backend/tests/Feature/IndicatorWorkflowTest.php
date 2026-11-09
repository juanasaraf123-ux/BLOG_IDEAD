<?php

namespace Tests\Feature;

use App\Models\AcademicPeriod;
use App\Models\ClassifierItem;
use App\Models\Indicator;

class IndicatorWorkflowTest extends IdeadTestCase
{
    public function test_catalog_contains_all_76_indicators_from_excel(): void
    {
        $this->assertSame(76, Indicator::count());
        $this->getJson('/api/public/v1/modules')->assertOk()->assertJsonCount(13);
    }

    public function test_full_submission_workflow_with_separation_of_duties_and_suppression(): void
    {
        $coord = $this->userWithRole('coordinador', ['DARCA']);
        $dir = $this->userWithRole('director');
        $ind = Indicator::where('code', 'M02-I05')->first(); // perfil sociodemográfico (AGR, k = 5)
        $period = AcademicPeriod::where('code', '2026-1')->first();
        $f = ClassifierItem::where('code', 'sexo_f')->first();
        $m = ClassifierItem::where('code', 'sexo_m')->first();

        $sid = $this->actingAs($coord)->postJson('/api/admin/v1/submissions', ['indicator_id' => $ind->id])->assertCreated()->json('id');
        $this->actingAs($coord)->putJson("/api/admin/v1/submissions/$sid/values", ['values' => [
            ['period_id' => $period->id, 'value' => 100],
            ['period_id' => $period->id, 'classifier_item_id' => $f->id, 'value' => 97],
            ['period_id' => $period->id, 'classifier_item_id' => $m->id, 'value' => 3],
        ]])->assertOk();

        // Nada es público antes de publicar
        $this->getJson('/api/public/v1/indicators/M02-I05')->assertJsonPath('status', 'pendiente');

        $this->actingAs($coord)->postJson("/api/admin/v1/submissions/$sid/submit")->assertOk();
        $this->actingAs($coord)->postJson("/api/admin/v1/submissions/$sid/review", ['decision' => 'aprobado'])->assertForbidden();
        $this->actingAs($coord)->postJson("/api/admin/v1/submissions/$sid/publish")->assertForbidden();
        $this->actingAs($dir)->postJson("/api/admin/v1/submissions/$sid/review", ['decision' => 'aprobado'])->assertOk();
        $this->actingAs($dir)->postJson("/api/admin/v1/submissions/$sid/publish")->assertOk()->assertJsonPath('status', 'publicado');

        $data = $this->getJson('/api/public/v1/indicators/M02-I05?period=2026-1')->assertOk()->json('data');
        $this->assertEquals(100, $data['kpi']['value']);
        $masc = collect($data['breakdown'])->firstWhere('label', 'Sexo: Masculino');
        $this->assertNull($masc['value'], 'Las celdas menores a k deben reservarse');
        $this->assertTrue($masc['suppressed']);
    }

    public function test_values_are_validated(): void
    {
        $coord = $this->userWithRole('coordinador', ['PRIDEAD']);
        $ind = Indicator::where('code', 'M11-I03')->first(); // porcentaje sin desagregaciones
        $period = AcademicPeriod::where('code', '2026')->first();
        $sid = $this->actingAs($coord)->postJson('/api/admin/v1/submissions', ['indicator_id' => $ind->id])->assertCreated()->json('id');
        $this->actingAs($coord)->putJson("/api/admin/v1/submissions/$sid/values", ['values' => [['period_id' => $period->id, 'value' => 140]]])->assertStatus(422);
        $this->actingAs($coord)->putJson("/api/admin/v1/submissions/$sid/values", ['values' => [['period_id' => $period->id, 'cat_id' => 1, 'value' => 40]]])->assertStatus(422);
        $this->actingAs($coord)->putJson("/api/admin/v1/submissions/$sid/values", ['values' => [['period_id' => $period->id, 'value' => 88.5]]])->assertOk();
    }

    public function test_coordinator_cannot_load_data_for_other_dependencies(): void
    {
        $coord = $this->userWithRole('coordinador', ['DARCA']);
        $ind = Indicator::where('code', 'M11-I01')->first(); // PRIDEAD
        $this->actingAs($coord)->postJson('/api/admin/v1/submissions', ['indicator_id' => $ind->id])->assertForbidden();
    }

    public function test_sensitive_indicator_is_not_published_without_authorization(): void
    {
        $this->getJson('/api/public/v1/indicators/M02-I07')->assertOk()->assertJsonPath('status', 'pendiente_autorizacion');
    }

    public function test_csv_import(): void
    {
        $coord = $this->userWithRole('coordinador', ['SAIDEAD']);
        $ind = Indicator::where('code', 'M01-I01')->first();
        $sid = $this->actingAs($coord)->postJson('/api/admin/v1/submissions', ['indicator_id' => $ind->id])->json('id');
        $csv = \Illuminate\Http\UploadedFile::fake()->createWithContent('datos.csv', "periodo;nivel;valor\n2026-1;;14\n2026-1;universitario;11\n");
        $r = $this->actingAs($coord)->post("/api/admin/v1/submissions/$sid/import", ['file' => $csv], ['Accept' => 'application/json'])->assertOk();
        $this->assertCount(2, $r->json('values'));
    }
}
