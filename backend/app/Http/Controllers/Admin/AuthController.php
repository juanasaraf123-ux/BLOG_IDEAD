<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Settings;
use App\Support\Audit;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

/**
 * Autenticación del panel (sesión con cookie HttpOnly + CSRF vía Sanctum SPA):
 * inicio/cierre de sesión, segundo factor TOTP, recuperación y cambio de contraseña.
 * Los intentos fallidos se limitan por correo+IP.
 */
class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    public static function passwordRule(): PasswordRule
    {
        return PasswordRule::min(12)->letters()->mixedCase()->numbers()->symbols();
    }

    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $key = 'login:'.Str::lower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            Audit::log('auth.locked', null, ['email' => $data['email']]);
            throw ValidationException::withMessages(['email' => 'Demasiados intentos. Intente de nuevo en '.RateLimiter::availableIn($key).' segundos.']);
        }
        $user = User::where('email', $data['email'])->first();
        if (! $user || ! $user->is_active || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($key, 900);
            Audit::log('auth.failed', null, ['email' => $data['email']]);
            throw ValidationException::withMessages(['email' => 'Credenciales inválidas o cuenta inactiva.']);
        }
        RateLimiter::clear($key);

        if ($user->mfa_enabled) {
            $request->session()->put('mfa_pending_user', $user->id);
            $request->session()->put('mfa_pending_at', now()->timestamp);
            $request->session()->put('mfa_remember', false);

            return response()->json(['mfa_required' => true]);
        }

        return $this->completeLogin($request, $user);
    }

    public function mfaChallenge(Request $request)
    {
        $data = $request->validate(['code' => 'required|digits:6']);
        $userId = $request->session()->get('mfa_pending_user');
        $at = (int) $request->session()->get('mfa_pending_at');
        if (! $userId || now()->timestamp - $at > 300) {
            throw ValidationException::withMessages(['code' => 'La verificación expiró. Inicie sesión de nuevo.']);
        }
        $key = 'mfa:'.$userId;
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            throw ValidationException::withMessages(['code' => 'Demasiados intentos. Espere unos minutos.']);
        }
        $user = User::findOrFail($userId);
        if (! (new Google2FA)->verifyKey($user->mfa_secret, $data['code'], 1)) {
            RateLimiter::hit($key, 900);
            Audit::log('auth.mfa_failed', $user, [], $user->id);
            throw ValidationException::withMessages(['code' => 'Código incorrecto.']);
        }
        RateLimiter::clear($key);
        $request->session()->forget(['mfa_pending_user', 'mfa_pending_at']);

        return $this->completeLogin($request, $user);
    }

    private function completeLogin(Request $request, User $user)
    {
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->saveQuietly();
        Audit::log('auth.login', $user);

        return $this->me($request);
    }

    public function logout(Request $request)
    {
        Audit::log('auth.logout', $request->user());
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles:id,code,name', 'dependencies:id,code,name');

        return [
            'user' => $user,
            'permissions' => $user->permissionCodes(),
            'mfa_enforced' => (bool) (int) Settings::get('mfa_enforced', 0),
            'must_setup_mfa' => (bool) (int) Settings::get('mfa_enforced', 0) && ! $user->mfa_enabled,
        ];
    }

    /** Genera un secreto TOTP pendiente de confirmación y devuelve el URI otpauth para el código QR. */
    public function mfaSetup(Request $request)
    {
        $g = new Google2FA;
        $secret = $g->generateSecretKey(32);
        $request->session()->put('mfa_setup_secret', $secret);
        $uri = $g->getQRCodeUrl('IDEAD Portal', $request->user()->email, $secret);

        return ['secret' => $secret, 'otpauth_uri' => $uri];
    }

    public function mfaConfirm(Request $request)
    {
        $data = $request->validate(['code' => 'required|digits:6']);
        $secret = $request->session()->get('mfa_setup_secret');
        abort_unless($secret, 422, 'Inicie la configuración del segundo factor primero.');
        if (! (new Google2FA)->verifyKey($secret, $data['code'], 1)) {
            throw ValidationException::withMessages(['code' => 'Código incorrecto.']);
        }
        $user = $request->user();
        $user->forceFill(['mfa_secret' => $secret, 'mfa_enabled' => true])->save();
        $request->session()->forget('mfa_setup_secret');
        Audit::log('auth.mfa_enabled', $user);

        return $this->me($request);
    }

    public function mfaDisable(Request $request)
    {
        $data = $request->validate(['password' => 'required|string']);
        abort_if((bool) (int) Settings::get('mfa_enforced', 0), 422, 'La política institucional exige el segundo factor.');
        abort_unless(Hash::check($data['password'], $request->user()->password), 422, 'Contraseña incorrecta.');
        $request->user()->forceFill(['mfa_secret' => null, 'mfa_enabled' => false])->save();
        Audit::log('auth.mfa_disabled', $request->user());

        return $this->me($request);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);
        $key = 'forgot:'.$request->ip();
        abort_if(RateLimiter::tooManyAttempts($key, 5), 429, 'Demasiadas solicitudes.');
        RateLimiter::hit($key, 3600);
        Password::sendResetLink(['email' => $data['email']]);
        Audit::log('auth.password_reset_requested', null, ['email' => $data['email']]);

        // Respuesta idéntica exista o no la cuenta (evita enumeración de usuarios).
        return ['message' => 'Si la cuenta existe, recibirá un correo con instrucciones para restablecer la contraseña.'];
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string', 'email' => 'required|email',
            'password' => ['required', 'confirmed', self::passwordRule()],
        ]);
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => $password, 'password_changed_at' => now(), 'remember_token' => Str::random(60)])->save();
            event(new PasswordReset($user));
            Audit::log('auth.password_reset', $user, [], $user->id);
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => 'El enlace no es válido o expiró.']);
        }

        return ['message' => 'Contraseña actualizada. Ya puede iniciar sesión.'];
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', 'different:current_password', self::passwordRule()],
        ]);
        $user = $request->user();
        abort_unless(Hash::check($data['current_password'], $user->password), 422, 'La contraseña actual es incorrecta.');
        $user->forceFill(['password' => $data['password'], 'password_changed_at' => now()])->save();
        Audit::log('auth.password_changed', $user);

        return ['message' => 'Contraseña actualizada.'];
    }
}
