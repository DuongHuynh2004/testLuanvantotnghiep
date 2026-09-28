<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Tạo hoặc cập nhật tài khoản quản trị, khách hàng và địa chỉ mẫu; chạy lại sẽ đặt lại thông tin mẫu.
     */
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'SUNÉA Admin',
                'phone' => '0900000001',
                'password' => 'Admin@123456',
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ],
        );

        $customers = [
            [
                'name' => 'Ngọc Minh',
                'email' => 'minh@example.com',
                'phone' => '0901234567',
            ],
            [
                'name' => 'Lan Anh',
                'email' => 'lananh@example.com',
                'phone' => '0912345678',
            ],
            [
                'name' => 'Hoàng Nam',
                'email' => 'nam@example.com',
                'phone' => '0987654321',
            ],
        ];

        foreach ($customers as $customer) {
            User::query()->updateOrCreate(
                ['email' => $customer['email']],
                [
                    'name' => $customer['name'],
                    'phone' => $customer['phone'],
                    'password' => 'Customer@123456',
                    'role' => User::ROLE_CUSTOMER,
                    'email_verified_at' => now(),
                ],
            );
        }

        Address::query()->updateOrCreate(
            [
                'user_id' => User::query()->where('email', 'minh@example.com')->value('id'),
                'is_default' => true,
            ],
            [
                'receiver_name' => 'Ngọc Minh',
                'phone' => '0901234567',
                'province' => 'TP. Hồ Chí Minh',
                'district' => 'Quận 1',
                'ward' => 'Phường Bến Nghé',
                'address_detail' => '12 Nguyễn Huệ',
                'is_default' => true,
            ],
        );

        $this->command?->info("Seeded users. Admin: {$admin->email} / Admin@123456");
    }
}
