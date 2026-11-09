<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Siembra solo el catálogo estructural (sin cifras). Los datos de demostración se cargan aparte:
     *   php artisan db:seed --class=DemoDataSeeder
     * El primer administrador técnico se crea con: php artisan idead:crear-admin
     */
    public function run(): void
    {
        $this->call(BaseCatalogSeeder::class);
    }
}
