<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TenantUserController extends Controller
{
    /**
     * List all users for the current organization
     */
    public function index(Request $request)
    {
        // Must be ADMIN_TENANT to view all users
        if ($request->user()->role !== 'ADMIN_TENANT') {
            return response()->json(['error' => 'Accès refusé. Vous devez être administrateur de l\'organisation.'], 403);
        }

        // Thanks to TenantScoped, this automatically only returns users for the current tenant
        $users = User::orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    /**
     * Create a new user in the current organization
     */
    public function store(Request $request)
    {
        // Must be ADMIN_TENANT to create users
        if ($request->user()->role !== 'ADMIN_TENANT') {
            return response()->json(['error' => 'Accès refusé. Vous devez être administrateur de l\'organisation.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:DELEGATE,MANAGER,ADMIN_TENANT',
        ]);

        // Thanks to TenantScoped, the tenant_id is automatically attached!
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user
        ], 201);
    }

    /**
     * Remove a user from the organization
     */
    public function destroy(Request $request, $id)
    {
        // Must be ADMIN_TENANT to delete users
        if ($request->user()->role !== 'ADMIN_TENANT') {
            return response()->json(['error' => 'Accès refusé. Vous devez être administrateur de l\'organisation.'], 403);
        }

        // Prevent self-deletion
        if ($request->user()->id == $id) {
            return response()->json(['error' => 'Vous ne pouvez pas supprimer votre propre compte.'], 400);
        }

        // Thanks to TenantScoped, they can only find and delete users in their own tenant
        $user = User::findOrFail($id);
        
        // Activities will be deleted via database cascade, but reports will be preserved (foreign key set to null)
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès']);
    }
}
