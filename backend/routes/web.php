<?php

use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ApiResponse::success([
        'frontend' => env('FRONTEND_URL', 'http://localhost:5173'),
        'api' => url('/api/health'),
    ], 'SUNÉA API is running. Use the React frontend for the store.');
});
