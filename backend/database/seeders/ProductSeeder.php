<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Size;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ProductSeeder extends Seeder
{
    /** Đồng bộ 20 sản phẩm, ảnh thật và bốn size mà không làm mất tồn kho đã chỉnh. */
    public function run(): void
    {
        Storage::disk('public')->makeDirectory('products');

        $catalog = require database_path('seeders/data/products.php');
        $sizes = Size::query()->get()->keyBy('name');
        $categories = Category::query()->get()->keyBy('slug');

        foreach ($catalog as $item) {
            $category = $categories->get($item['category']);

            if (! $category) {
                continue;
            }

            $product = Product::query()->where('slug', $item['slug'])->first()
                ?? Product::query()->where('slug', $item['legacy_slug'])->first()
                ?? new Product;

            $product->fill([
                'category_id' => $category->id,
                'name' => $item['name'],
                'slug' => $item['slug'],
                'description' => $item['description'],
                'material' => $item['material'],
                'base_price' => $item['base_price'],
                'sale_price' => $item['sale_price'],
                'promotion_name' => $item['sale_price'] ? 'Ưu đãi mùa hè' : null,
                'promotion_starts_at' => null,
                'promotion_ends_at' => null,
                'status' => Product::STATUS_ACTIVE,
                'featured' => $item['featured'],
            ])->save();

            $this->syncImage($product, $item['image']);
            $this->seedVariants($product, $item, $sizes);
        }

        Product::query()->whereIn('slug', ['coastal-chino', 'breeze-camp-shorts'])->get()->each->delete();
        $this->deleteUnusedImageFiles(collect($catalog)->pluck('image')->all());
    }

    /** Thay ảnh cũ bằng đúng một ảnh có nguyên tên file do người dùng cung cấp. */
    private function syncImage(Product $product, string $filename): void
    {
        $path = 'products/'.$filename;
        $source = database_path('seeders/assets/products/'.$filename);

        if (! is_file($source)) {
            throw new RuntimeException("Không tìm thấy ảnh nguồn: {$filename}");
        }

        $oldPaths = $product->images()->pluck('image')->all();
        $product->images()->delete();
        Storage::disk('public')->delete(array_values(array_diff($oldPaths, [$path])));
        Storage::disk('public')->put($path, file_get_contents($source));
        $product->images()->create(['image' => $path, 'is_primary' => true, 'sort_order' => 1]);
    }

    /** Tạo biến thể còn thiếu cho bốn size và giữ nguyên tồn kho đã có. */
    private function seedVariants(Product $product, array $item, Collection $sizes): void
    {
        $skuPrefix = 'SNE-'.$product->id.'-'.Str::upper(Str::substr(str_replace('-', '', $product->slug), 0, 8));

        foreach ($item['sizes'] as $sizeName) {
            $size = $sizes->get($sizeName);

            if (! $size) {
                continue;
            }

            $product->variants()->firstOrCreate(['size_id' => $size->id], [
                'sku' => $skuPrefix.'-'.$sizeName,
                'price' => null,
                'stock_quantity' => fake()->numberBetween(8, 40),
            ]);
        }
    }

    /** Dọn mọi ảnh cũ hoặc ảnh không còn thuộc catalog hiện tại. */
    private function deleteUnusedImageFiles(array $filenames): void
    {
        $expectedPaths = collect($filenames)->map(fn (string $filename): string => 'products/'.$filename);
        $unusedPaths = collect(Storage::disk('public')->files('products'))->diff($expectedPaths)->values()->all();

        Storage::disk('public')->delete($unusedPaths);
    }
}
