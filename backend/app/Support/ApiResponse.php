<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Chuẩn hóa phản hồi JSON thành công với dữ liệu, thông báo và mã HTTP.
     */
    public static function success(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $status);
    }

    /**
     * Chuẩn hóa phản hồi JSON lỗi với thông báo, chi tiết lỗi và mã HTTP.
     */
    public static function error(string $message, int $status = 400, mixed $errors = null, mixed $data = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $data,
            'errors' => $errors,
        ], $status);
    }
}
