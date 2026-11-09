<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registros institucionales exigidos en el punto 12 del prompt: Matrículas, Docentes, Graduados, Personal administrativo,
 * Publicaciones y Solicitudes de actualización.
 *
 * Protección de datos (Ley 1581 de 2012):
 * - Parte privada: se guardan los datos personales completos (tipo y número de documento, nombres, correo, teléfono),
 *   CIFRADOS en la base con la llave de la aplicación y ocultos en las respuestas por defecto.
 * - Para unir archivos y períodos sin descifrar se usa una clave seudónima (HMAC-SHA256 del documento con IDEAD_PSEUDONYM_KEY).
 * - Los datos sensibles (poblaciones de especial protección) también se guardan cifrados.
 * - Estas tablas solo se consultan en el panel privado; el portal publica únicamente agregados aprobados (indicator_values).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Lotes de carga de registros (archivo de origen, quién lo cargó, validación)
        Schema::create('record_imports', function (Blueprint $table) {
            $table->id();
            $table->string('entity', 40);              // enrollments | teachers | graduations | administrative_staff
            $table->foreignId('period_id')->nullable()->constrained('academic_periods')->restrictOnDelete();
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->unsignedInteger('rows_total')->default(0);
            $table->unsignedInteger('rows_valid')->default(0);
            $table->json('errors')->nullable();
            $table->string('status', 20)->default('cargado'); // cargado | validado | rechazado | reemplazado
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['entity', 'period_id']);
        });

        // MATRÍCULAS: un registro por estudiante, programa y período
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('academic_periods')->restrictOnDelete();
            $table->char('student_key', 64);            // seudónimo HMAC para unir archivos y períodos
            $table->string('document_type', 5)->nullable(); // CC | TI | CE | PA | PEP
            $table->text('document_number')->nullable(); // CIFRADO
            $table->text('full_name')->nullable();       // CIFRADO
            $table->text('email')->nullable();           // CIFRADO
            $table->text('phone')->nullable();           // CIFRADO
            $table->foreignId('program_id')->constrained()->restrictOnDelete();
            $table->foreignId('cat_id')->constrained()->restrictOnDelete();
            $table->string('enrollment_status', 20)->default('matriculado'); // matriculado | retirado | aplazado | graduando
            $table->boolean('is_new')->default(false);  // estudiante de primer ingreso
            $table->unsignedTinyInteger('semester')->nullable();
            $table->string('sex', 20)->nullable();      // femenino | masculino | otro | no_informa
            $table->string('age_range', 10)->nullable(); // m20 | 20_24 | 25_29 | 30_34 | 35_39 | 40m
            $table->string('marital_status', 20)->nullable();
            $table->unsignedTinyInteger('stratum')->nullable(); // 1..6
            $table->string('residence_zone', 10)->nullable();   // urbana | rural
            $table->foreignId('residence_municipality_id')->nullable()->constrained('municipalities')->nullOnDelete();
            $table->text('special_population')->nullable(); // CIFRADO: etnia, discapacidad, víctima, otras
            $table->decimal('academic_average', 3, 2)->nullable();
            $table->boolean('is_student_representative')->default(false);
            $table->foreignId('import_id')->nullable()->constrained('record_imports')->nullOnDelete();
            $table->timestamps();
            $table->unique(['period_id', 'student_key', 'program_id']);
            $table->index(['period_id', 'cat_id']);
            $table->index(['period_id', 'program_id']);
            $table->index('student_key');
        });

        // DOCENTES: un registro por docente y período; sus asignaciones por CAT/programa en teacher_assignments
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('academic_periods')->restrictOnDelete();
            $table->char('teacher_key', 64);            // seudónimo HMAC para unir archivos y períodos
            $table->string('document_type', 5)->nullable(); // CC | TI | CE | PA | PEP
            $table->text('document_number')->nullable(); // CIFRADO
            $table->text('full_name')->nullable();       // CIFRADO
            $table->text('email')->nullable();           // CIFRADO
            $table->text('phone')->nullable();           // CIFRADO
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete(); // departamento académico
            $table->string('contract_type', 20);        // carrera | catedra | ocasional | otra
            $table->string('max_education', 20)->nullable(); // profesional | especializacion | maestria | doctorado
            $table->string('sex', 20)->nullable();
            $table->string('age_range', 10)->nullable();
            $table->string('category', 20)->nullable(); // auxiliar | asistente | asociado | titular (carrera)
            $table->unsignedTinyInteger('seniority_years')->nullable();
            $table->boolean('in_research_group')->default(false);
            $table->boolean('in_research_seedbed')->default(false);
            $table->boolean('teaching_seminar')->default(false); // seminario de docencia / cualificación
            $table->foreignId('import_id')->nullable()->constrained('record_imports')->nullOnDelete();
            $table->timestamps();
            $table->unique(['period_id', 'teacher_key']);
            $table->index(['period_id', 'contract_type']);
        });

        Schema::create('teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cat_id')->constrained()->restrictOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('courses')->default(0);
            $table->unsignedSmallInteger('hours')->nullable();
            $table->timestamps();
            $table->unique(['teacher_id', 'cat_id', 'program_id']);
        });

        // GRADUADOS: un registro por título otorgado (una persona puede tener varios → personas = claves distintas)
        Schema::create('graduations', function (Blueprint $table) {
            $table->id();
            $table->char('graduate_key', 64);            // seudónimo HMAC para unir archivos y períodos
            $table->string('document_type', 5)->nullable(); // CC | TI | CE | PA | PEP
            $table->text('document_number')->nullable(); // CIFRADO
            $table->text('full_name')->nullable();       // CIFRADO
            $table->text('email')->nullable();           // CIFRADO
            $table->text('phone')->nullable();           // CIFRADO
            $table->foreignId('program_id')->constrained()->restrictOnDelete();
            $table->foreignId('cat_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('period_id')->constrained('academic_periods')->restrictOnDelete(); // período de grado
            $table->foreignId('cohort_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->date('graduation_date');
            $table->string('degree_option', 60)->nullable(); // opción de grado (Acuerdo 015 de 2008)
            $table->string('sex', 20)->nullable();
            $table->decimal('final_average', 3, 2)->nullable();
            $table->string('employment_status', 20)->nullable(); // empleado | emprendedor | desempleado | sin_dato
            $table->foreignId('import_id')->nullable()->constrained('record_imports')->nullOnDelete();
            $table->timestamps();
            $table->unique(['graduate_key', 'program_id']);
            $table->index(['period_id', 'program_id']);
            $table->index('graduate_key');
        });

        // PERSONAL ADMINISTRATIVO (planta y contratistas, por separado mediante staff_type)
        Schema::create('administrative_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('academic_periods')->restrictOnDelete();
            $table->char('staff_key', 64);            // seudónimo HMAC para unir archivos y períodos
            $table->string('document_type', 5)->nullable(); // CC | TI | CE | PA | PEP
            $table->text('document_number')->nullable(); // CIFRADO
            $table->text('full_name')->nullable();       // CIFRADO
            $table->text('email')->nullable();           // CIFRADO
            $table->text('phone')->nullable();           // CIFRADO
            $table->string('staff_type', 20);           // administrativo | contratista
            $table->string('contract_type', 30)->nullable(); // carrera_administrativa | libre_nombramiento | provisional | temporal | prestacion_servicios
            $table->string('position', 120)->nullable(); // cargo
            $table->string('grade', 20)->nullable();
            $table->string('main_function', 255)->nullable();
            $table->string('contract_number', 60)->nullable(); // contratistas
            $table->date('contract_start')->nullable();
            $table->date('contract_end')->nullable();
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cat_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sex', 20)->nullable();
            $table->string('age_range', 10)->nullable();
            $table->string('education_level', 20)->nullable(); // bachiller | tecnico | profesional | posgrado
            $table->unsignedTinyInteger('seniority_years')->nullable();
            $table->boolean('trained_in_period')->default(false);
            $table->foreignId('import_id')->nullable()->constrained('record_imports')->nullOnDelete();
            $table->timestamps();
            $table->unique(['period_id', 'staff_key']);
            $table->index(['period_id', 'staff_type']);
        });

        // PUBLICACIONES (producción académica y publicaciones institucionales — PIDEAD)
        Schema::create('publications', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 180)->unique();
            $table->string('title');
            $table->string('publication_type', 30);     // articulo | libro | capitulo | ponencia | creacion | revista | boletin | informe
            $table->text('authors')->nullable();        // autoría pública, tal como figura en la publicación
            $table->unsignedSmallInteger('year');
            $table->string('publisher', 255)->nullable(); // editorial, revista o evento
            $table->string('isbn_issn', 30)->nullable();
            $table->string('doi', 120)->nullable();
            $table->string('url')->nullable();
            $table->text('abstract')->nullable();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('research_group_id')->nullable()->constrained('catalog_items')->nullOnDelete();
            $table->foreignId('document_id')->nullable()->constrained()->nullOnDelete(); // archivo público asociado
            $table->string('publication_status', 20)->default('borrador');
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->index(['publication_type', 'year']);
        });

        // SOLICITUDES DE ACTUALIZACIÓN: la Dirección pide a una dependencia actualizar un indicador o información
        Schema::create('update_requests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('indicator_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('dependency_id')->constrained()->restrictOnDelete();
            $table->foreignId('period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->string('status', 20)->default('abierta'); // abierta | en_proceso | atendida | cancelada
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('attended_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('attended_at')->nullable();
            $table->foreignId('submission_id')->nullable()->constrained('data_submissions')->nullOnDelete(); // lote que la atiende
            $table->text('response')->nullable();
            $table->timestamps();
            $table->index(['dependency_id', 'status']);
        });
    }

    public function down(): void
    {
        foreach (['update_requests', 'publications', 'administrative_staff', 'graduations', 'teacher_assignments', 'teachers', 'enrollments', 'record_imports'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
