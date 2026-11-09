<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Contenidos (noticias, actividades, multimedia, carrusel, equipo, páginas, listados institucionales),
 * proyectos, convenios, gestión documental y caja menor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('name');
        });

        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 180)->unique();
            $table->string('title');
            $table->string('summary', 500)->nullable();
            $table->longText('body')->nullable(); // HTML saneado
            $table->foreignId('category_id')->nullable()->constrained('news_categories')->nullOnDelete();
            $table->foreignId('cover_file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->foreignId('cat_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('borrador'); // borrador | en_revision | devuelto | publicado | despublicado
            $table->timestamp('publish_at')->nullable();      // programación
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->index(['status', 'publish_at']);
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 180)->unique();
            $table->string('title');
            $table->string('summary', 500)->nullable();
            $table->longText('body')->nullable();
            $table->string('category', 60)->nullable(); // académica | cultural | deportiva | bienestar | institucional
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('cat_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cover_file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->string('status', 20)->default('borrador');
            $table->timestamp('publish_at')->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->index(['status', 'starts_at']);
        });

        Schema::create('media_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type', 10); // foto | video
            $table->foreignId('file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->string('video_url')->nullable(); // solo YouTube/Vimeo (validado)
            $table->text('description')->nullable();
            $table->string('album', 120)->nullable();
            $table->foreignId('cat_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('image_authorized')->default(false); // autorización de uso de imagen
            $table->string('status', 20)->default('borrador');
            $table->timestamp('publish_at')->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
        });

        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->foreignId('image_file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->string('link_url')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
        });

        Schema::create('team_units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon', 40)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 60)->nullable();
            $table->string('link')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('title');
            $table->longText('body')->nullable();
            $table->string('status', 20)->default('borrador');
            $table->timestamp('publish_at')->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Listados institucionales genéricos: grupos y semilleros, plataformas digitales, formación continua, opciones de grado, hitos...
        Schema::create('catalog_items', function (Blueprint $table) {
            $table->id();
            $table->string('list_type', 60);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 120)->nullable();
            $table->string('url')->nullable();
            $table->string('state', 60)->nullable(); // vigente | finalizado | en curso...
            $table->unsignedSmallInteger('year')->nullable();
            $table->date('date')->nullable();
            $table->foreignId('cat_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->string('publication_status', 20)->default('borrador');
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->index(['list_type', 'publication_status']);
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 180)->unique();
            $table->string('code', 40)->nullable();
            $table->string('name');
            $table->text('objective')->nullable();
            $table->longText('description')->nullable();
            $table->string('investment_line', 60)->nullable(); // infraestructura | equipos | tecnologia | academia | bienestar | otra
            $table->string('status', 20)->default('radicado');   // radicado | aprobado | en_ejecucion | finalizado | suspendido
            $table->string('location')->nullable();
            $table->decimal('approved_amount', 18, 2)->nullable();
            $table->decimal('executed_amount', 18, 2)->nullable();
            $table->decimal('progress_pct', 5, 2)->nullable();
            $table->unsignedInteger('beneficiaries_count')->nullable();
            $table->text('results')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cover_file_id')->nullable()->constrained('files')->nullOnDelete();
            $table->string('publication_status', 20)->default('borrador');
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
            $table->index(['status', 'publication_status']);
        });

        Schema::create('cat_project', function (Blueprint $table) {
            $table->foreignId('cat_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->primary(['cat_id', 'project_id']);
        });

        Schema::create('project_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->date('reported_on');
            $table->decimal('progress_pct', 5, 2);
            $table->decimal('executed_amount', 18, 2)->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
        });

        Schema::create('agreements', function (Blueprint $table) {
            $table->id();
            $table->string('number', 60)->nullable();
            $table->string('counterpart');
            $table->text('object');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 20)->default('vigente'); // vigente | terminado | en_liquidacion
            $table->decimal('contributed_amount', 18, 2)->nullable();
            $table->boolean('is_public')->default(false);
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
        });

        Schema::create('document_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name');
            $table->string('default_confidentiality', 20)->default('interno');
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained('document_categories')->restrictOnDelete();
            $table->foreignId('dependency_id')->nullable()->constrained()->nullOnDelete();
            $table->string('confidentiality', 20); // publico | interno | restringido | financiero
            $table->string('status', 20)->default('vigente'); // borrador | vigente | archivado
            $table->string('related_type', 40)->nullable(); // project | agreement | cat | submission
            $table->unsignedBigInteger('related_id')->nullable();
            $table->unsignedInteger('current_version')->default(1);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['confidentiality', 'status']);
            $table->index(['related_type', 'related_id']);
        });

        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_no');
            $table->foreignId('file_id')->constrained('files')->restrictOnDelete();
            $table->string('change_note')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['document_id', 'version_no']);
        });

        Schema::create('petty_cash_budgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->string('name');
            $table->decimal('amount', 18, 2);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('petty_cash_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_id')->constrained('petty_cash_budgets')->restrictOnDelete();
            $table->date('expense_date');
            $table->string('concept');
            $table->string('provider')->nullable();
            $table->string('invoice_number', 60)->nullable();
            $table->decimal('amount', 18, 2);
            $table->foreignId('document_id')->nullable()->constrained()->nullOnDelete(); // soporte (documento financiero)
            $table->string('status', 20)->default('registrado'); // registrado | legalizado | anulado
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['petty_cash_expenses', 'petty_cash_budgets', 'document_versions', 'documents', 'document_categories', 'agreements', 'project_progress', 'cat_project', 'projects', 'catalog_items', 'pages', 'team_units', 'hero_slides', 'media_items', 'events', 'news', 'news_categories'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
