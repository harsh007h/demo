<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::apiResource('parties', PartyController::class);
    Route::get('/orders/stats', [OrderController::class, 'stats']);
    Route::apiResource('orders', OrderController::class);
    Route::get('/stocks/stats', [StockController::class, 'stats']);
    Route::apiResource('stocks', StockController::class);

    // Only Admins can manage users
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});

