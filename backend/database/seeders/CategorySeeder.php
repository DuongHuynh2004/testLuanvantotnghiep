<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Tạo hoặc cập nhật ba danh mục Áo, Quần, Phụ kiện theo slug.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Áo', 'slug' => 'tops', 'description' => 'Áo thun, sơ mi và áo mùa hè.'],
            ['name' => 'Quần', 'slug' => 'bottoms', 'description' => 'Quần short và quần dài mùa hè.'],
            ['name' => 'Phụ kiện', 'slug' => 'accessories', 'description' => 'Mũ, túi và phụ kiện mùa hè.'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                [
                    ...$category,
                    'status' => Category::STATUS_ACTIVE,
                ],
            );
        }
    }
}
