<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\BaseCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class IdeadTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaseCatalogSeeder::class);
        config(['idead.demo_data' => false]);
    }

    protected function userWithRole(string $role, array $dependencyCodes = []): User
    {
        $u = new User(['name' => "Usuario $role", 'email' => "$role-".uniqid().'@test.local', 'is_active' => true]);
        $u->password = 'Clave-Segura-2026!';
        $u->save();
        $u->roles()->sync([Role::where('code', $role)->value('id')]);
        $u->dependencies()->sync(\App\Models\Dependency::whereIn('code', $dependencyCodes)->pluck('id'));

        return $u;
    }
}
