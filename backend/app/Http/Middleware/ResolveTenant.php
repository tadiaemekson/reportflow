<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\TenantManager;
use App\Models\Tenant;

class ResolveTenant
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenantSlug = $request->header('X-Tenant-Slug');

        if (!$tenantSlug) {
            // Fallback: check subdomain
            $host = $request->getHost();
            $parts = explode('.', $host);
            if (count($parts) > 1 && $parts[0] !== 'localhost' && $parts[0] !== '127') {
                $tenantSlug = $parts[0];
            }
        }

        if ($tenantSlug) {
            $tenant = Tenant::where('slug', $tenantSlug)->first();
            if ($tenant) {
                app(TenantManager::class)->setTenantId($tenant->id);
            } else {
                return response()->json(['error' => 'Tenant not found.'], 404);
            }
        }

        return $next($request);
    }
}
