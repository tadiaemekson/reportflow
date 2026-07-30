<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ActivityController;
use App\Http\Controllers\Api\V1\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::middleware(['tenant'])->group(function () {
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    // Protected routes (Sanctum + Tenant context)
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        // Auth profile actions
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Standard Tenant Actions (Blocked for SuperAdmins)
        Route::middleware([\App\Http\Middleware\BlockSuperAdmin::class])->group(function () {
            // Organization Team Management
            Route::get('/users', [\App\Http\Controllers\Api\V1\TenantUserController::class, 'index']);
            Route::post('/users', [\App\Http\Controllers\Api\V1\TenantUserController::class, 'store']);
            Route::delete('/users/{id}', [\App\Http\Controllers\Api\V1\TenantUserController::class, 'destroy']);

            // Activities logging API
            Route::get('/activities', [ActivityController::class, 'index']);
            Route::post('/activities', [ActivityController::class, 'store']);

            // Reports compilation and lifecycle workflows
            Route::get('/reports', [ReportController::class, 'index']);
            Route::get('/reports/{id}', [ReportController::class, 'show']);
            Route::post('/reports/generate', [ReportController::class, 'generate']);
            Route::put('/reports/{id}', [ReportController::class, 'update']);
            Route::post('/reports/{id}/submit', [ReportController::class, 'submit']);
            Route::post('/reports/{id}/approve', [ReportController::class, 'approve']);
            Route::post('/reports/{id}/archive', [ReportController::class, 'archive']);
        });

        // System administration
        Route::get('/admin/tenants', [\App\Http\Controllers\Api\V1\AdminController::class, 'index']);
        Route::post('/admin/tenants', [\App\Http\Controllers\Api\V1\AdminController::class, 'registerTenant']);
        Route::put('/admin/tenants/{id}', [\App\Http\Controllers\Api\V1\AdminController::class, 'update']);
        Route::delete('/admin/tenants/{id}', [\App\Http\Controllers\Api\V1\AdminController::class, 'destroy']);
    });
});
