<?php

namespace Tests\Feature;

use Database\Seeders\CategorySeeder;
use Database\Seeders\ProductSeeder;
use Database\Seeders\SizeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UnisexCatalogTest extends TestCase
{
    use RefreshDatabase;

    /** Danh mục mẫu chỉ dùng size và không còn bảng hoặc cột màu. */
    public function test_seeded_catalog_has_four_size_only_variants_per_product(): void
    {
        Storage::fake('public');
        $this->seed([CategorySeeder::class, SizeSeeder::class, ProductSeeder::class]);

        $this->assertEqualsCanonicalizing(['tops', 'bottoms', 'accessories'], DB::table('categories')->pluck('slug')->all());
        $this->assertSame(['S', 'M', 'L', 'XL'], DB::table('sizes')->orderBy('sort_order')->pluck('name')->all());
        $this->assertFalse(Schema::hasTable('colors'));
        $this->assertFalse(Schema::hasColumn('product_variants', 'color_id'));
        $this->assertDatabaseCount('products', 20);
        $this->assertDatabaseCount('product_images', 20);

        $expectedCategoryCounts = ['tops' => 10, 'bottoms' => 5, 'accessories' => 5];

        foreach ($expectedCategoryCounts as $categorySlug => $expectedCount) {
            $categoryId = DB::table('categories')->where('slug', $categorySlug)->value('id');
            $this->assertSame($expectedCount, DB::table('products')->where('category_id', $categoryId)->count());
        }

        foreach (DB::table('products')->get() as $product) {
            $this->assertSame(4, DB::table('product_variants')->where('product_id', $product->id)->count());
            $this->assertSame(1, DB::table('product_images')->where('product_id', $product->id)->count());
            $this->assertSame(1, DB::table('product_images')->where('product_id', $product->id)->where('is_primary', true)->count());
        }

        $this->assertCount(20, Storage::disk('public')->files('products'));
        Storage::disk('public')->assertExists('products/aothun-1.png');
        Storage::disk('public')->assertExists('products/phukien-5.png');

        $variant = DB::table('product_variants')->first();
        DB::table('product_variants')->where('id', $variant->id)->update(['stock_quantity' => 3]);
        $this->seed(ProductSeeder::class);
        $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'stock_quantity' => 3]);

        $product = DB::table('products')->first();
        $this->getJson('/api/products/'.$product->slug)
            ->assertOk()
            ->assertJsonCount(4, 'data.variants')
            ->assertJsonMissingPath('data.variants.0.color');
    }

    /** Migration chuẩn hóa loại size cũ và bổ sung đủ bốn size được hỗ trợ. */
    public function test_catalog_normalization_keeps_only_supported_sizes(): void
    {
        $categoryId = DB::table('categories')->insertGetId(['slug' => 'women', 'name' => 'Nữ']);
        $productId = DB::table('products')->insertGetId(['category_id' => $categoryId, 'name' => 'Legacy shirt', 'slug' => 'legacy-shirt', 'base_price' => 200000]);
        $xxlId = DB::table('sizes')->insertGetId(['name' => 'XXL']);
        $retiredId = DB::table('product_variants')->insertGetId(['product_id' => $productId, 'size_id' => $xxlId, 'sku' => 'RETIRE', 'price' => 200000, 'stock_quantity' => 4]);

        $migration = require database_path('migrations/2026_09_20_170607_normalize_unisex_catalog.php');
        $migration->up();

        $this->assertDatabaseMissing('product_variants', ['id' => $retiredId]);
        $this->assertDatabaseHas('products', ['id' => $productId, 'category_id' => DB::table('categories')->where('slug', 'tops')->value('id')]);
        $this->assertSame(4, DB::table('product_variants')->where('product_id', $productId)->count());
        $this->assertDatabaseCount('sizes', 4);
        $this->assertDatabaseCount('categories', 3);
    }
}
