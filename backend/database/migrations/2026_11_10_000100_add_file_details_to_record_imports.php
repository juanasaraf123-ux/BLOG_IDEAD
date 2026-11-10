<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cargas de bases institucionales desde el panel: nombre del archivo original y filas con error.
 * El archivo original NO se conserva (contiene datos personales sin cifrar); solo su nombre.
 * Estados: cargado | reemplazado | anulado.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('record_imports', function (Blueprint $table) {
            $table->string('file_name', 255)->nullable()->after('file_id');
            $table->unsignedInteger('rows_error')->default(0)->after('rows_valid');
        });
    }

    public function down(): void
    {
        Schema::table('record_imports', function (Blueprint $table) {
            $table->dropColumn(['file_name', 'rows_error']);
        });
    }
};
