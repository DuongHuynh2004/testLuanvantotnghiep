<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Chuẩn hóa danh mục unisex và bốn size được hỗ trợ. */
    public function up(): void
    {
        DB::transaction(function () {
            $now = now();
            foreach (['tops' => 'Áo', 'bottoms' => 'Quần', 'accessories' => 'Phụ kiện'] as $slug => $name) {
                DB::table('categories')->updateOrInsert(['slug' => $slug], [
                    'name' => $name, 'status' => 'active', 'updated_at' => $now,
                ]);
            }

            $categories = DB::table('categories')->pluck('id', 'slug');
            foreach (DB::table('categories')->whereNotIn('slug', ['tops', 'bottoms', 'accessories'])->get() as $category) {
                $target = in_array($category->slug, ['shorts', 'pants']) ? 'bottoms' : 'tops';
                DB::table('products')->where('category_id', $category->id)->update(['category_id' => $categories[$target]]);
                DB::table('categories')->where('id', $category->id)->delete();
            }

            foreach (['S', 'M', 'L', 'XL'] as $index => $name) {
                DB::table('sizes')->updateOrInsert(['name' => $name], ['sort_order' => $index + 1, 'updated_at' => $now]);
            }

            $sizes = DB::table('sizes')->whereIn('name', ['S', 'M', 'L', 'XL'])->pluck('id');
            DB::table('product_variants')->whereNotIn('size_id', $sizes)->delete();
            DB::table('sizes')->whereNotIn('id', $sizes)->delete();

            foreach (DB::table('products')->get() as $product) {
                foreach ($sizes as $sizeId) {
                    $key = ['product_id' => $product->id, 'size_id' => $sizeId];
                    if (! DB::table('product_variants')->where($key)->exists()) {
                        DB::table('product_variants')->insert([
                            ...$key,
                            'sku' => "SKU-{$product->id}-{$sizeId}",
                            'price' => $product->sale_price ?? $product->base_price,
                            'stock_quantity' => 0,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                }
            }
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Catalog normalization is irreversible. Restore the pre-migration backup to recover retired variants.');
    }
};
