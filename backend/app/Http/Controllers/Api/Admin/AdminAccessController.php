<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAccessController extends Controller
{
    /**
     * Trả hồ sơ và quyền quản trị sau khi middleware xác thực vai trò.
     */
    public function __invoke(Request $request): JsonResponse
    {
        return ApiResponse::success([
            'user' => (new UserResource($request->user()))->resolve(),
            'access' => 'admin',
        ], 'Admin access granted');
    }
}
