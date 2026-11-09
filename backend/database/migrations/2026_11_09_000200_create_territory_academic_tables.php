<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Territorio (departamentos, municipios, CAT) y oferta académica (niveles, áreas, programas, períodos, oferta por CAT).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('disk', 20); // public | private
            $table->string('path');
            $table->string('original_name');
            $table->string('mime', 120);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->char('code', 2)->unique(); // código DANE
            $table->string('name');
        });

        Schema::create('municipalities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->restrictOnDelete();
            $table->string('code', 5)->nullable()->unique(); // código DANE (DIVIPOLA)
            $table->string('name');
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
            $table->index('department_id');
        });

        Schema::create('education_levels', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('cycle', 20); // pregrado | posgrado
            $table->unsignedSmallInteger('sort')->default(0);
        });

        Schema::create('knowledge_areas', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('classification', 40)->default('pendiente'); // NBC | CINE-F | pendiente
        });

        Schema::create('academic_periods', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // 2026-2, 2026, 2026-V
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('term')->nullable();
            $table->string('type', 20); // semestre | anio | vigencia | cohorte
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->index(['year', 'term']);
        });

        Schema::create('cats', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('name');
            $table->foreignId('municipality_id')->constrained()->restrictOnDelete();
            $table->string('address')->nullable();
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
            $table->boolean('coords_verified')->default(false);
            $table->text('history')->nullable();
            $table->string('phone', 60)->nullable();
            $table->string('email')->nullable();
            $table->text('schedule')->nullable();
            $table->string('manager_name')->nullable();
            $table->boolean('manager_public')->default(false);
            $table->date('opened_on')->nullable();
            $table->string('status', 20)->default('activo'); // activo | inactivo | reactivado
            $table->foreignId('photo_file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->string('publication_status', 20)->default('borrador');
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->index(['publication_status', 'status']);
        });

        Schema::create('cat_sites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cat_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('ownership', 20); // publica | privada | propia
            $table->string('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('cat_facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cat_id')->constrained()->cascadeOnDelete();
            $table->string('facility_type', 40); // aula | laboratorio | sala_computo | biblioteca | auditorio | deportivo | bienestar | equipos | conectividad
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('capacity')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
            $table->unique(['cat_id', 'facility_type']);
        });

        Schema::create('cat_municipality', function (Blueprint $table) {
            $table->foreignId('cat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('municipality_id')->constrained()->cascadeOnDelete();
            $table->primary(['cat_id', 'municipality_id']);
        });

        Schema::create('cat_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cat_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 20); // apertura | cierre | reactivacion | hito
            $table->date('event_date');
            $table->string('description')->nullable();
            $table->string('act_reference')->nullable();
            $table->timestamps();
        });

        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 150)->unique();
            $table->string('snies_code', 20)->nullable()->unique();
            $table->string('name');
            $table->foreignId('level_id')->constrained('education_levels')->restrictOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('knowledge_areas')->nullOnDelete();
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->string('modality', 40)->default('distancia');
            $table->unsignedSmallInteger('duration_semesters')->nullable();
            $table->unsignedSmallInteger('credits')->nullable();
            $table->text('description')->nullable();
            $table->date('qualified_registry_until')->nullable();
            $table->date('accreditation_until')->nullable();
            $table->string('status', 20)->default('activo'); // activo | en_cierre | proyectado | inactivo
            $table->string('publication_status', 20)->default('borrador');
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
        });

        Schema::create('program_offerings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('academic_periods')->restrictOnDelete();
            $table->boolean('admits_new')->default(true);
            $table->unsignedInteger('approved_quota')->nullable();
            $table->string('act_reference')->nullable();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->unique(['program_id', 'cat_id', 'period_id']);
            $table->index(['cat_id', 'period_id']);
        });
    }

    public function down(): void
    {
        foreach (['program_offerings', 'programs', 'cat_events', 'cat_municipality', 'cat_facilities', 'cat_sites', 'cats', 'academic_periods', 'knowledge_areas', 'education_levels', 'municipalities', 'departments', 'files'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
