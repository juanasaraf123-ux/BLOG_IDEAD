<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    /** Limitadores de tasa con contadores independientes por tipo de operación. */
    public function boot(): void
    {
        RateLimiter::for('public', fn (Request $r) => Limit::perMinute(1500)->by('public|'.$r->ip()));
        RateLimiter::for('public-heavy', fn (Request $r) => Limit::perMinute(30)->by('heavy|'.$r->ip()));
        RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(10)->by('auth|'.$r->ip()));
        RateLimiter::for('admin', fn (Request $r) => Limit::perMinute(600)->by('admin|'.($r->user()?->id ?: $r->ip())));
        // Cualquier cambio de datos invalida la caché pública (versión), salvo registros puramente internos.
        $skip = [\App\Models\AuditLog::class, \App\Models\ChangeHistory::class, \App\Models\User::class, \App\Models\StoredFile::class];
        Event::listen(['eloquent.saved: *', 'eloquent.deleted: *'], function (string $event, array $data) use ($skip) {
            if (! in_array(get_class($data[0]), $skip, true)) {
                \App\Support\PublicCache::bump();
            }
        });
        RateLimiter::for('uploads', fn (Request $r) => Limit::perMinute(60)->by('uploads|'.($r->user()?->id ?: $r->ip())));
    }
}
