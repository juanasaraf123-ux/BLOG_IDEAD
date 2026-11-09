<?php

use Illuminate\Support\Facades\Route;

// El backend solo expone la API; la raíz redirige al portal público.
Route::get('/', fn () => redirect(config('app.portal_url')));
