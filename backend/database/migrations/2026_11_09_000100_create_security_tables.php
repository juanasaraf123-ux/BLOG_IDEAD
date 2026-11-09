<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Seguridad: RBAC (roles, permisos, alcance por dependencia), historial de cambios y auditoría.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dependencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('dependencies')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80)->unique();
            $table->string('group', 60);
            $table->string('description');
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'user_id']);
        });

        Schema::create('dependency_user', function (Blueprint $table) {
            $table->foreignId('dependency_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['dependency_id', 'user_id']);
        });

        Schema::create('change_history', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 80);
            $table->unsignedBigInteger('entity_id');
            $table->string('event', 20); // created | updated | deleted
            $table->json('changes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 80);
            $table->string('entity_type', 80)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('meta')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['action', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 80)->primary();
            $table->text('value')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['settings', 'audit_logs', 'change_history', 'dependency_user', 'role_user', 'permission_role', 'permissions', 'roles', 'dependencies'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
