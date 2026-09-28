<?php

namespace Database\Seeders;

use App\Models\Size;
use Illuminate\Database\Seeder;

class SizeSeeder extends Seeder
{
    /**
     * Tạo hoặc cập nhật bốn size S, M, L, XL cùng thứ tự hiển thị.
     */
    public function run(): void
    {
        $sizes = ['S', 'M', 'L', 'XL'];

        foreach ($sizes as $index => $name) {
            Size::query()->updateOrCreate(
                ['name' => $name],
                ['sort_order' => $index + 1],
            );
        }
    }
}
