<?php

namespace Tests\Feature;

use App\Models\AcademicPeriod;
use App\Models\Cat;
use App\Models\Department;
use App\Models\EducationLevel;
use App\Models\Enrollment;
use App\Models\Municipality;
use App\Models\Program;
use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use OpenSpout\Reader\XLSX\Reader;

class RecordImportTest extends IdeadTestCase
{
    private int $period;

    protected function setUp(): void
    {
        parent::setUp();
        config(['idead.pseudonym_key' => str_repeat('k', 64)]);
        $m = Municipality::create(['department_id' => Department::where('code', '73')->value('id'), 'code' => '73168', 'name' => 'Chaparral']);
        Cat::create(['slug' => 'cat-chaparral', 'name' => 'CAT Chaparral', 'municipality_id' => $m->id]);
        Program::create(['slug' => 'lic-pi', 'name' => 'Licenciatura en Pedagogía Infantil', 'snies_code' => '1234', 'level_id' => EducationLevel::where('code', 'universitario')->value('id')]);
        $this->period = AcademicPeriod::where('code', '2026-1')->value('id');
    }

    private function csv(array $lines): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'csv').'.csv';
        file_put_contents($path, "\u{FEFF}".implode("\n", $lines));

        return new UploadedFile($path, 'matricula.csv', 'text/csv', null, true);
    }

    private const HEAD = 'Tipo de documento;Número de documento;Nombres y apellidos;Programa;CAT;Primer ingreso;Sexo;Fecha de nacimiento';

    public function test_template_has_data_instructions_and_valid_values_sheets(): void
    {
        $res = $this->actingAs($this->userWithRole('coordinador'))->get('/api/admin/v1/records/estudiantes/template')->assertOk();
        $file = $res->baseResponse->getFile()->getPathname();
        $r = new Reader;
        $r->open($file);
        $sheets = [];
        $firstRow = null;
        foreach ($r->getSheetIterator() as $s) {
            $sheets[] = $s->getName();
            foreach ($s->getRowIterator() as $row) {
                $firstRow ??= $row->toArray();
                break;
            }
        }
        $r->close();
        $this->assertSame(['Datos', 'Instrucciones', 'Valores válidos'], $sheets);
        $this->assertSame('Tipo de documento', $firstRow[0]);
    }

    public function test_analyze_reports_errors_by_row_and_column_without_saving(): void
    {
        $u = $this->userWithRole('coordinador');
        $res = $this->actingAs($u)->post('/api/admin/v1/records/estudiantes/analyze', ['period_id' => $this->period, 'file' => $this->csv([
            self::HEAD,
            'CC;1.110.555.123;Ana Pérez;Licenciatura en Pedagogía Infantil;Chaparral;Sí;F;15/03/2001',
            'CC;;Sin Documento;1234;CAT Chaparral;No;M;',
            'XX;999888;Luis;Programa que no existe;Ibagué;tal vez;M;31/02/2001',
            'CC;1110555123;Ana repetida;lic-pi;Chaparral;Sí;F;',
        ])])->assertOk();
        $res->assertJsonPath('rows_total', 4)->assertJsonPath('rows_valid', 1)->assertJsonPath('rows_error', 3);
        $msgs = collect($res->json('errors'));
        $this->assertTrue($msgs->contains(fn ($e) => $e['row'] === 3 && $e['column'] === 'Número de documento'));
        $this->assertTrue($msgs->contains(fn ($e) => $e['row'] === 4 && $e['column'] === 'Programa'));
        $this->assertTrue($msgs->contains(fn ($e) => $e['row'] === 4 && $e['column'] === 'Fecha de nacimiento'));
        $this->assertTrue($msgs->contains(fn ($e) => $e['row'] === 5 && str_contains($e['message'], 'repetido')));
        $this->assertStringNotContainsString('1110555123', $res->getContent());
        $this->assertSame(0, Enrollment::count());
    }

    public function test_import_saves_encrypted_replaces_same_period_and_can_be_undone(): void
    {
        $u = $this->userWithRole('coordinador');
        $file = fn () => $this->csv([self::HEAD,
            'CC;1110555123;Ana Pérez;Licenciatura en Pedagogía Infantil;Chaparral;Sí;F;15/03/2001',
            'TI;1005;Juan Ruiz;1234;CAT Chaparral;No;M;01/01/2008',
        ]);
        $this->actingAs($u)->post('/api/admin/v1/records/estudiantes/import', ['period_id' => $this->period, 'file' => $file()])->assertOk()->assertJsonPath('rows_valid', 2);
        $this->assertSame(2, Enrollment::count());
        $raw = (array) DB::table('enrollments')->first();
        $this->assertStringNotContainsString('Ana', (string) $raw['full_name']);
        $this->assertSame('m20', Enrollment::where('document_type', 'TI')->value('age_range'));

        // Volver a cargar el mismo semestre reemplaza (no duplica)
        $this->actingAs($u)->post('/api/admin/v1/records/estudiantes/import', ['period_id' => $this->period, 'file' => $file()])->assertOk();
        $this->assertSame(2, Enrollment::count());
        $imports = $this->actingAs($u)->getJson('/api/admin/v1/records/estudiantes/imports')->json('data');
        $this->assertSame(['cargado', 'reemplazado'], array_column($imports, 'status'));

        $this->actingAs($u)->getJson('/api/admin/v1/records/estudiantes/summary?period_id='.$this->period)->assertOk()->assertJsonPath('kpis.0.value', 2);

        $this->actingAs($u)->deleteJson('/api/admin/v1/records/estudiantes/imports/'.$imports[0]['id'])->assertNoContent();
        $this->assertSame(0, Enrollment::count());
    }

    public function test_personal_data_requires_permission_and_is_audited(): void
    {
        $this->actingAs($this->userWithRole('coordinador'))->post('/api/admin/v1/records/estudiantes/import', ['period_id' => $this->period, 'file' => $this->csv([self::HEAD,
            'CC;1110555123;Ana Pérez;1234;Chaparral;Sí;F;15/03/2001'])])->assertOk();

        $coord = $this->userWithRole('coordinador');
        $masked = $this->actingAs($coord)->getJson('/api/admin/v1/records/estudiantes/rows')->assertOk();
        $this->assertStringNotContainsString('Ana', $masked->getContent());
        $masked->assertJsonPath('data.0.documento', 'CC ···123');
        $this->actingAs($coord)->getJson('/api/admin/v1/records/estudiantes/rows?personal=1')->assertForbidden();

        $dir = $this->userWithRole('director');
        $this->actingAs($dir)->getJson('/api/admin/v1/records/estudiantes/rows?personal=1')->assertOk()->assertJsonPath('data.0.nombre', 'Ana Pérez');
        $this->assertDatabaseHas('audit_logs', ['user_id' => $dir->id, 'action' => 'records.view_personal']);

        $this->actingAs($this->userWithRole('comunicaciones'))->getJson('/api/admin/v1/records')->assertForbidden();
    }

    public function test_teachers_with_several_assignments_are_one_teacher(): void
    {
        $this->actingAs($this->userWithRole('coordinador'))->post('/api/admin/v1/records/docentes/import', ['period_id' => $this->period, 'file' => $this->csv([
            'Tipo de documento;Número de documento;Nombres y apellidos;Tipo de vinculación;CAT;Programa;Número de cursos',
            'CC;93555111;Docente Uno;Cátedra;Chaparral;1234;2',
            'CC;93555111;Docente Uno;Cátedra;Chaparral;;1',
        ])])->assertOk()->assertJsonPath('rows_valid', 1);
        $this->assertSame(1, Teacher::count());
        $this->assertSame(2, Teacher::first()->assignments()->count());
    }
}
