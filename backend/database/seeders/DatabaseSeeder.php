<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Siembra el catálogo estructural (sin cifras) y la información pública oficial de la Universidad. Los datos de demostración se cargan aparte:
     *   php artisan db:seed --class=DemoDataSeeder
     * El primer administrador técnico se crea con: php artisan idead:crear-admin
     */
    public function run(): void
    {
        $this->call(BaseCatalogSeeder::class);
        // Información pública oficial de la Universidad del Tolima (programas, CAT, misión, publicaciones...).
        $this->call(UniversidadTolimaSeeder::class);
    }
}
