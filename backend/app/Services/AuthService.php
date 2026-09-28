<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * Tạo người dùng với vai trò khách hàng và phát token đăng nhập.
     *
     * @param  array{name: string, email: string, password: string, phone?: string|null}  $payload
     * @return array{user: User, token: string}
     */
    public function register(array $payload): array
    {
        $user = User::query()->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? null,
            'password' => $payload['password'],
            'role' => User::ROLE_CUSTOMER,
        ]);

        return $this->issueToken($user, 'register');
    }

    /**
     * Kiểm tra email, mật khẩu đã băm và phát token nếu thông tin đúng.
     *
     * @param  array{email: string, password: string}  $credentials
     * @return array{user: User, token: string}
     */
    public function login(array $credentials): array
    {
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw new AuthenticationException('Email hoặc mật khẩu không đúng.');
        }

        return $this->issueToken($user, 'login');
    }

    /**
     * Xóa PersonalAccessToken đang dùng; không thu hồi phiên trên thiết bị khác.
     */
    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }

    /**
     * Phát token Sanctum và trả người dùng cùng token dạng rõ cho lần phản hồi này.
     *
     * @return array{user: User, token: string}
     */
    private function issueToken(User $user, string $name): array
    {
        $token = $user->createToken($name)->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
