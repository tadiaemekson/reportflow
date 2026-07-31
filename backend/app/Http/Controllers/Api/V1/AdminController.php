<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /**
     * Get all Tenants with usage statistics.
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'SUPERADMIN') {
            return response()->json(['error' => 'Action non autorisée. Rôle SuperAdmin requis.'], 403);
        }

        $tenants = Tenant::withCount(['users', 'activities', 'reports'])->get();
        return response()->json($tenants);
    }

    /**
     * Update an existing Tenant.
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'SUPERADMIN') {
            return response()->json(['error' => 'Action non autorisée. Rôle SuperAdmin requis.'], 403);
        }

        $tenant = Tenant::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:tenants,slug,' . $tenant->id,
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:102400', // 100MB
        ]);

        $data = $request->only('name', 'slug');

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($tenant->logo_url) {
                $oldPath = str_replace(asset('storage/'), '', $tenant->logo_url);
                Storage::disk('public')->delete($oldPath);
            }
            
            $path = $request->file('logo')->store('logos', 'public');
            $data['logo_url'] = '/storage/' . $path;
        }

        $tenant->update($data);

        return response()->json([
            'message' => 'Organisation mise à jour avec succès.',
            'tenant' => $tenant
        ]);
    }

    /**
     * Delete an existing Tenant.
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'SUPERADMIN') {
            return response()->json(['error' => 'Action non autorisée. Rôle SuperAdmin requis.'], 403);
        }

        $tenant = Tenant::findOrFail($id);
        $tenant->delete();

        return response()->json([
            'message' => 'Organisation supprimée avec succès.'
        ]);
    }

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
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:102400', // 100MB max
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|max:255|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        $logoUrl = null;
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $logoUrl = '/storage/' . $path;
        }

        // 3. Create Tenant
        $tenant = Tenant::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'logo_url' => $logoUrl,
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
