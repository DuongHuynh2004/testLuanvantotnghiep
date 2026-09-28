<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Chặn yêu cầu nếu người dùng chưa đăng nhập hoặc không có vai trò quản trị.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return ApiResponse::error('Forbidden', 403);
        }

        return $next($request);
    }
}
