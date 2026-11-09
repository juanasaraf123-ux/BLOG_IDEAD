<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indicadores genéricos: catálogo con ficha técnica, valores históricos dimensionados y lotes con flujo de revisión.
 * Un indicador nuevo es un registro en `indicators`; no requiere tablas nuevas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indicator_modules', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('number')->unique();
            $table->string('slug', 80)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon', 40)->nullable();
        });

        Schema::create('data_sources', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name');
            $table->string('kind', 30)->default('dependencia'); // dependencia | sistema | base_datos | externo | acto_administrativo | persona
            $table->string('official_name_status', 20)->default('pendiente'); // validado | pendiente
        });

        Schema::create('classifiers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name');
            // true: las categorías forman una partición (su suma es el total). false: son medidas distintas que no se suman.
            $table->boolean('is_partition')->default(false);
        });

        Schema::create('classifier_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classifier_id')->constrained()->cascadeOnDelete();
            $table->string('code', 60);
            $table->string('label');
            $table->unsignedSmallInteger('sort')->default(0);
            $table->unique(['classifier_id', 'code']);
        });

        Schema::create('indicators', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // M02-I03
            $table->foreignId('module_id')->constrained('indicator_modules')->restrictOnDelete();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('information_required')->nullable();
            $table->string('suggested_visualization')->nullable(); // texto del Excel
            $table->string('source_text')->nullable();            // fuente literal del Excel
            $table->string('unit', 30)->default('personas');      // personas | títulos | porcentaje | pesos | número | razón
            $table->string('value_type', 20)->default('count');   // count | percent | currency | ratio | number
            $table->string('periodicity', 20)->default('semestral');
            $table->string('chart_type', 20)->default('bar');     // bar | line | stacked | distribution | kpi | table | map | progress
            $table->string('group_by', 20)->nullable();           // program | cat | department | municipality | level | area | classifier
            $table->foreignId('classifier_id')->nullable()->constrained()->nullOnDelete();
            $table->json('allowed_dimensions');                   // ["program","cat",...]
            $table->string('widget', 60)->nullable();             // listado/ficha complementaria
            $table->string('filters_text')->nullable();
            $table->string('publication_level', 10)->default('PUB'); // PUB | AGR | AGR_S | MIX
            $table->unsignedTinyInteger('min_cell_size')->nullable();
            $table->text('methodology')->nullable();
            $table->string('methodology_status', 20)->default('pendiente');
            $table->foreignId('responsible_dependency_id')->nullable()->constrained('dependencies')->nullOnDelete();
            $table->text('observations')->nullable();
            $table->boolean('publication_authorized')->default(true); // AGR_S requiere autorización expresa
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['module_id', 'sort']);
        });

        Schema::create('data_source_indicator', function (Blueprint $table) {
            $table->foreignId('indicator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->primary(['indicator_id', 'data_source_id']);
        });

        Schema::create('data_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('indicator_id')->constrained()->restrictOnDelete();
            $table->string('title')->nullable();
            $table->string('status', 20)->default('borrador'); // borrador | enviado | devuelto | aprobado | publicado | reemplazado | retirado
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('supersedes_id')->nullable()->constrained('data_submissions')->nullOnDelete();
            $table->foreignId('source_file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->text('source_note')->nullable();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->index(['indicator_id', 'status']);
        });

        Schema::create('indicator_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('data_submissions')->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('academic_periods')->restrictOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('cat_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('municipality_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('level_id')->nullable()->constrained('education_levels')->restrictOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('knowledge_areas')->restrictOnDelete();
            $table->foreignId('classifier_item_id')->nullable()->constrained()->restrictOnDelete();
            $table->decimal('value', 20, 4)->nullable();
            $table->boolean('is_suppressed')->default(false);
            $table->string('note')->nullable();
            $table->string('dims_hash', 64); // garantiza unicidad de la combinación de dimensiones por lote
            $table->unique(['submission_id', 'dims_hash']);
            $table->index(['period_id']);
            $table->index(['cat_id', 'period_id']);
            $table->index(['program_id', 'period_id']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('reviewable_type', 60);
            $table->unsignedBigInteger('reviewable_id');
            $table->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $table->string('decision', 20); // enviado | aprobado | devuelto | publicado | despublicado
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['reviewable_type', 'reviewable_id']);
        });

        Schema::create('home_highlights', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('icon', 40);
            $table->string('metric_type', 30)->default('indicator'); // indicator | events_year | cats_count | programs_count
            $table->foreignId('indicator_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('classifier_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('link')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['home_highlights', 'reviews', 'indicator_values', 'data_submissions', 'data_source_indicator', 'indicators', 'classifier_items', 'classifiers', 'data_sources', 'indicator_modules'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
