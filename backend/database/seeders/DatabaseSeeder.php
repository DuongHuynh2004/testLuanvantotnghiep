<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Chạy các seeder theo thứ tự để dữ liệu tham chiếu có trước sản phẩm và biến thể.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            SizeSeeder::class,
            ProductSeeder::class,
            ComboSeeder::class,
            CouponSeeder::class,
        ]);
    }
}
