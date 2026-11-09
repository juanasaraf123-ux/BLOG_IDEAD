<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\AuthController;
use App\Models\Role;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/** Crea el primer usuario administrador técnico (no existen credenciales por defecto). */
class CreateAdmin extends Command
{
    protected $signature = 'idead:crear-admin {--name=} {--email=} {--role=admin_tecnico}';

    protected $description = 'Crea un usuario del panel con el rol indicado (por defecto administrador técnico).';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Nombre');
        $email = $this->option('email') ?: $this->ask('Correo');
        $password = env('IDEAD_ADMIN_PASSWORD') ?: $this->secret('Contraseña (mín. 12, mayúsculas, minúsculas, números y símbolos)');
        $v = Validator::make(compact('name', 'email', 'password'), [
            'name' => 'required|string|max:255', 'email' => 'required|email|unique:users,email', 'password' => ['required', AuthController::passwordRule()],
        ]);
        if ($v->fails()) {
            foreach ($v->errors()->all() as $e) {
                $this->error($e);
            }

            return self::FAILURE;
        }
        $role = Role::where('code', $this->option('role'))->first();
        if (! $role) {
            $this->error('Rol inexistente. Ejecute primero: php artisan db:seed');

            return self::FAILURE;
        }
        $u = new User(['name' => $name, 'email' => $email, 'is_active' => true]);
        $u->password = $password;
        $u->password_changed_at = now();
        $u->save();
        $u->roles()->sync([$role->id]);
        Audit::log('user.created_cli', $u, ['role' => $role->code]);
        $this->info("Usuario {$email} creado con el rol {$role->name}.");

        return self::SUCCESS;
    }
}
