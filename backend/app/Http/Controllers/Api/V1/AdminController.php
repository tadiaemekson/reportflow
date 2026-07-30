<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * Register a new Tenant (Delegation/Service) and its initial Admin User.
     */
    public function registerTenant(Request $request)
    {
        // 1. Enforce SUPERADMIN role access
        if ($request->user()->role !== 'SUPERADMIN') {
            return response()->json(['error' => 'Action non autorisée. Rôle SuperAdmin requis.'], 403);
        }

        // 2. Validate input
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:tenants,slug',
            'logo_url' => 'nullable|string|max:255',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|max:255|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        // 3. Create Tenant
        $tenant = Tenant::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'logo_url' => $request->logo_url,
        ]);

        // 4. Temporarily switch tenant context to the new tenant to create the admin user
        $originalTenantId = app(TenantManager::class)->getTenantId();
        app(TenantManager::class)->setTenantId($tenant->id);

        $admin = User::create([
            'name' => $request->admin_name,
            'email' => $request->admin_email,
            'password' => Hash::make($request->admin_password),
            'role' => 'ADMIN_TENANT',
        ]);

        // 5. Restore original tenant context
        app(TenantManager::class)->setTenantId($originalTenantId);

        return response()->json([
            'message' => 'Nouveau service / délégation créé avec succès.',
            'tenant' => $tenant,
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
            ],
        ], 201);
    }
}
