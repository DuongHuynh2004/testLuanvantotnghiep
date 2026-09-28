<?php

namespace Database\Seeders;

use App\Models\Combo;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ComboSeeder extends Seeder
{
    /** Đồng bộ ba combo hè, sản phẩm thành phần và ảnh do người dùng cung cấp. */
    public function run(): void
    {
        $catalog = [
            ['name' => 'Combo Hoa Cúc Mint', 'slug' => 'combo-1', 'image' => 'combo-1.png', 'products' => ['daisy-mint-shirt', 'daisy-mint-shorts']],
            ['name' => 'Combo Nhiệt Đới', 'slug' => 'combo-2', 'image' => 'combo-2.png', 'products' => ['tropical-breeze-shirt', 'tropical-leaf-shorts']],
            ['name' => 'Combo Sóng Biển', 'slug' => 'combo-5', 'image' => 'combo-5.png', 'products' => ['ocean-wave-shirt', 'ocean-wave-shorts']],
        ];

        foreach ($catalog as $item) {
            $combo = Combo::query()->updateOrCreate(['slug' => $item['slug']], [
                'name' => $item['name'],
                'image' => 'combos/'.$item['image'],
                'discount_percent' => 5,
                'is_active' => true,
            ]);
            $products = Product::query()->whereIn('slug', $item['products'])->get()->keyBy('slug');

            if ($products->count() !== count($item['products'])) {
                throw new RuntimeException("Combo {$item['slug']} thiếu sản phẩm thành phần.");
            }

            $combo->products()->sync(collect($item['products'])->mapWithKeys(
                fn (string $slug, int $index): array => [$products[$slug]->id => ['sort_order' => $index + 1]],
            ));

            $source = database_path('seeders/assets/combos/'.$item['image']);
            if (! is_file($source)) {
                throw new RuntimeException("Không tìm thấy ảnh combo: {$item['image']}");
            }
            Storage::disk('public')->put($combo->image, file_get_contents($source));
        }

        Combo::query()->whereNotIn('slug', collect($catalog)->pluck('slug'))->delete();
        $expected = collect($catalog)->pluck('image')->map(fn (string $image): string => 'combos/'.$image);
        Storage::disk('public')->delete(collect(Storage::disk('public')->files('combos'))->diff($expected)->all());
    }
}
