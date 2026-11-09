<?php

namespace Tests\Feature;

use App\Models\AcademicPeriod;
use App\Models\Cat;
use App\Models\Department;
use App\Models\EducationLevel;
use App\Models\Enrollment;
use App\Models\Graduation;
use App\Models\Municipality;
use App\Models\Program;
use App\Support\Pseudonym;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class InstitutionalRecordsTest extends IdeadTestCase
{
    private Program $program;

    private Cat $cat;

    private int $period;

    protected function setUp(): void
    {
        parent::setUp();
        config(['idead.pseudonym_key' => str_repeat('k', 64)]);
        $m = Municipality::create(['department_id' => Department::where('code', '73')->value('id'), 'code' => '73001', 'name' => 'Ibagué']);
        $this->cat = Cat::create(['slug' => 'cat-t', 'name' => 'CAT T', 'municipality_id' => $m->id]);
        $this->program = Program::create(['slug' => 'p-t', 'name' => 'Programa T', 'level_id' => EducationLevel::where('code', 'universitario')->value('id')]);
        $this->period = AcademicPeriod::where('code', '2026-2')->value('id');
    }

    public function test_pseudonym_is_stable_irreversible_and_requires_a_key(): void
    {
        $a = Pseudonym::key('1.110.555.123');
        $this->assertSame($a, Pseudonym::key('1110555123'));
        $this->assertSame(64, strlen($a));
        $this->assertStringNotContainsString('1110555123', $a);
        config(['idead.pseudonym_key' => 'corta']);
        $this->expectException(\RuntimeException::class);
        Pseudonym::key('1110555123');
    }

    public function test_sensitive_data_is_encrypted_and_hidden(): void
    {
        $e = Enrollment::create(['period_id' => $this->period, 'student_key' => Pseudonym::key('99'), 'program_id' => $this->program->id, 'cat_id' => $this->cat->id, 'special_population' => ['victima' => true]]);
        $raw = DB::table('enrollments')->value('special_population');
        $this->assertStringNotContainsString('victima', $raw);
        $this->assertSame(['victima' => true], $e->fresh()->special_population);
        $this->assertStringNotContainsString('victima', $e->fresh()->toJson());
    }

    public function test_personal_data_is_stored_encrypted_and_hidden(): void
    {
        $e = Enrollment::create(['period_id' => $this->period, 'student_key' => Pseudonym::key('1110555123'), 'program_id' => $this->program->id, 'cat_id' => $this->cat->id,
            'document_type' => 'CC', 'document_number' => '1110555123', 'full_name' => 'Ana Pérez', 'email' => 'ana@example.com', 'phone' => '3000000000']);
        $raw = (array) DB::table('enrollments')->first();
        foreach (['document_number' => '1110555123', 'full_name' => 'Ana Pérez', 'email' => 'ana@example.com', 'phone' => '3000000000'] as $col => $plain) {
            $this->assertStringNotContainsString($plain, (string) $raw[$col], "$col debe estar cifrado en la base");
        }
        $fresh = $e->fresh();
        $this->assertSame('Ana Pérez', $fresh->full_name);
        $this->assertStringNotContainsString('Ana', $fresh->toJson());
        $this->assertStringNotContainsString('1110555123', $fresh->toJson());
    }

    public function test_student_cannot_be_enrolled_twice_in_same_program_and_period(): void
    {
        $row = ['period_id' => $this->period, 'student_key' => Pseudonym::key('77'), 'program_id' => $this->program->id, 'cat_id' => $this->cat->id];
        Enrollment::create($row);
        $this->expectException(QueryException::class);
        Enrollment::create($row);
    }

    public function test_graduates_and_degrees_are_counted_separately(): void
    {
        $other = Program::create(['slug' => 'p-2', 'name' => 'Especialización T', 'level_id' => EducationLevel::where('code', 'especializacion')->value('id')]);
        $key = Pseudonym::key('55');
        foreach ([$this->program, $other] as $p) {
            Graduation::create(['graduate_key' => $key, 'program_id' => $p->id, 'period_id' => $this->period, 'graduation_date' => '2026-12-01']);
        }
        $this->assertSame(2, Graduation::count(), 'títulos otorgados');
        $this->assertSame(1, Graduation::distinct()->count('graduate_key'), 'personas graduadas');
    }
}
