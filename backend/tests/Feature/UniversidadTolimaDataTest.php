<?php

namespace Tests\Feature;

use App\Models\Cat;
use App\Models\Page;
use App\Models\Program;
use App\Models\Publication;
use Database\Seeders\UniversidadTolimaSeeder;

/** La información pública oficial de la Universidad se carga completa, sin marca de demostración y sin duplicarse. */
class UniversidadTolimaDataTest extends IdeadTestCase
{
    public function test_official_public_data_loads_once_and_is_published(): void
    {
        $this->seed(UniversidadTolimaSeeder::class);
        $this->seed(UniversidadTolimaSeeder::class); // idempotente

        $this->assertSame(23, Program::where('is_demo', false)->where('publication_status', 'publicado')->count());
        $this->assertSame(25, Cat::where('is_demo', false)->where('publication_status', 'publicado')->count());
        $this->assertGreaterThan(1000, Publication::where('is_demo', false)->count());
        $this->assertSame('809', Program::where('slug', 'administracion-financiera')->value('snies_code'));
        $this->assertStringContainsString('Acuerdo 0237', Page::where('slug', 'sobre-idead')->value('body'));

        $this->getJson('/api/public/v1/cats')->assertOk();
        $this->getJson('/api/public/v1/programs/administracion-financiera')->assertOk()->assertJsonPath('snies_code', '809');
        $this->getJson('/api/public/v1/cats/cat-chaparral')->assertOk();
    }
}
