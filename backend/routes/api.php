<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\TransportController;
use App\Http\Controllers\NotificationController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/send-otp', [OtpController::class, 'sendOtp']);
Route::post('/verify-otp', [OtpController::class, 'verifyOtp']);

Route::middleware('auth:api')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    // Parties API
    Route::get('/parties', [PartyController::class, 'index']);
    Route::get('/parties/{party}', [PartyController::class, 'show']);
    
    // Orders API
    Route::get('/orders/stats', [OrderController::class, 'stats']);
    Route::apiResource('orders', OrderController::class);
    
    // Stocks API
    Route::get('/stocks/stats', [StockController::class, 'stats']);
    Route::get('/stocks', [StockController::class, 'index']);
    Route::get('/stocks/{stock}', [StockController::class, 'show']);

    // Only Admins can modify parties/stocks or manage users
    Route::middleware('admin')->group(function () {
        Route::post('/parties', [PartyController::class, 'store']);
        Route::put('/parties/{party}', [PartyController::class, 'update']);
        Route::delete('/parties/{party}', [PartyController::class, 'destroy']);

        Route::post('/stocks', [StockController::class, 'store']);
        Route::put('/stocks/{stock}', [StockController::class, 'update']);
        Route::delete('/stocks/{stock}', [StockController::class, 'destroy']);

        Route::apiResource('users', UserController::class);

        // Notifications API
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read/{id}', [NotificationController::class, 'markAsRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    });

    // Transports API
    Route::get('/transports', [TransportController::class, 'index']);
    Route::middleware('role:Admin')->group(function () {
        Route::post('/transports', [TransportController::class, 'store']);
        Route::put('/transports/{id}', [TransportController::class, 'update']);
        Route::delete('/transports/{id}', [TransportController::class, 'destroy']);
    });
});

