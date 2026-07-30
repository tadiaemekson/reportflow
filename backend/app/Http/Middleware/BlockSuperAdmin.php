<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockSuperAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role === 'SUPERADMIN') {
            return response()->json([
                'error' => 'Action non autorisée. Les super administrateurs ne peuvent pas interagir avec les données des organisations.'
            ], 403);
        }

        return $next($request);
    }
}
