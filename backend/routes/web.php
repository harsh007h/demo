<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/login');
});

Route::get('/login', function () {
    return response()->file(public_path('login.html'));
})->name('login');

Route::get('/dashboard', function () {
    return response()->file(public_path('dashboard.html'));
});

Route::get('/order', function () {
    return response()->file(public_path('order.html'));
});

Route::get('/stock', function () {
    return response()->file(public_path('stock.html'));
});

Route::get('/party', function () {
    return response()->file(public_path('party.html'));
});

Route::get('/transport', function () {
    return response()->file(public_path('transport.html'));
});

Route::get('/user', function () {
    return response()->file(public_path('user.html'));
});

Route::get('/alerts', function () {
    return response()->file(public_path('alerts.html'));
});
