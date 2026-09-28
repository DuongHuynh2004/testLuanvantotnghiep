<?php

namespace App\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    /**
     * Kiểm tra kết nối database và trả trạng thái hoạt động của API.
     */
    public function __invoke(): JsonResponse
    {
        $databaseStatus = 'disconnected';

        try {
            DB::connection()->getPdo();
            $databaseStatus = 'connected';
        } catch (Throwable) {
            $databaseStatus = 'disconnected';
        }

        return ApiResponse::success([
            'app' => config('app.name'),
            'environment' => config('app.env'),
            'database' => $databaseStatus,
        ], 'Fashion Store API is running');
    }
}
