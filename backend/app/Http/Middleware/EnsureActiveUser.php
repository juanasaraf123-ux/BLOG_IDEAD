<?php

namespace App\Http\Middleware;

use App\Services\Settings;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Cierra la sesión de usuarios desactivados y, si la política exige doble factor,
 * solo permite configurarlo hasta que el usuario lo active.
 */
class EnsureActiveUser
{
    private const MFA_SETUP_ROUTES = ['admin.me', 'admin.logout', 'admin.mfa.setup', 'admin.mfa.confirm', 'admin.password.change'];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user || ! $user->is_active) {
            Auth::guard('web')->logout();

            return response()->json(['message' => 'Sesión no válida.'], 401);
        }
        if ((int) Settings::get('mfa_enforced', 0) && ! $user->mfa_enabled && ! in_array($request->route()?->getName(), self::MFA_SETUP_ROUTES, true)) {
            return response()->json(['message' => 'Debe configurar el segundo factor de autenticación.', 'must_setup_mfa' => true], 403);
        }

        return $next($request);
    }
}
