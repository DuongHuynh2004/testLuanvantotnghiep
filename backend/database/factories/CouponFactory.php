<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    /** Tạo cấu hình mã kiểm thử; không tự phát hành mã trên database đang vận hành. */
    public function definition(): array
    {
        return ['code' => strtoupper(fake()->unique()->bothify('TEST-????####')), 'name' => 'Ưu đãi kiểm thử', 'discount_type' => 'percent', 'discount_value' => 10, 'minimum_order' => 0, 'is_active' => true];
    }
}
