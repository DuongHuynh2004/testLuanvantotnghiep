<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    /** Tạo mã mẫu ở trạng thái tắt; chạy lại không ghi đè điều kiện quản trị viên đã chỉnh. */
    public function run(): void
    {
        Coupon::query()->firstOrCreate(['code' => 'SUNEA10'], [
            'name' => 'Ưu đãi SUNÉA 10%',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'minimum_order' => 300000,
            'maximum_discount' => 50000,
            'usage_limit' => 100,
            'per_user_limit' => 1,
            'is_active' => false,
        ]);
    }
}
