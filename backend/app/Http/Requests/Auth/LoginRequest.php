<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Cho phép khách gửi yêu cầu xác thực trước khi đăng nhập.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Khai báo quy tắc kiểm tra dữ liệu đầu vào của yêu cầu.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Cung cấp thông báo lỗi kiểm tra dữ liệu bằng tiếng Việt.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không hợp lệ.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ];
    }
}
