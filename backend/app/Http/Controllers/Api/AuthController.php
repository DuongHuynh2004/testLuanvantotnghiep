<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Nhận dịch vụ xác thực từ container của Laravel.
     */
    public function __construct(private readonly AuthService $authService) {}

    /**
     * Tạo tài khoản từ dữ liệu hợp lệ và trả hồ sơ cùng Bearer token.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->safe()->only(['name', 'email', 'phone', 'password']));

        return ApiResponse::success([
            'user' => (new UserResource($result['user']))->resolve(),
            'token' => $result['token'],
            'token_type' => 'Bearer',
        ], 'Registered successfully', 201);
    }

    /**
     * Xác thực thông tin đăng nhập và trả hồ sơ cùng Bearer token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return ApiResponse::success([
            'user' => (new UserResource($result['user']))->resolve(),
            'token' => $result['token'],
            'token_type' => 'Bearer',
        ], 'Logged in successfully');
    }

    /**
     * Thu hồi token hiện tại của người dùng đã xác thực.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success(null, 'Logged out successfully');
    }

    /**
     * Kiểm tra quyền xem hồ sơ và trả thông tin người dùng hiện tại.
     */
    public function user(Request $request): JsonResponse
    {
        $this->authorize('view', $request->user());

        return ApiResponse::success((new UserResource($request->user()))->resolve(), 'Authenticated user');
    }

    /** Cập nhật thông tin cá nhân của tài khoản hiện tại mà không cho phép thay đổi vai trò. */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorize('update', $user);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user->update($validated);

        return ApiResponse::success((new UserResource($user->fresh()))->resolve(), 'Profile updated');
    }

    /**
     * Kiểm tra mật khẩu cũ rồi lưu mật khẩu mới qua cơ chế băm của model User.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $request->user()->password)) {
            return ApiResponse::error('Mật khẩu hiện tại không đúng.', 422);
        }

        $request->user()->update(['password' => $validated['password']]);

        return ApiResponse::success(null, 'Password changed successfully');
    }
}
