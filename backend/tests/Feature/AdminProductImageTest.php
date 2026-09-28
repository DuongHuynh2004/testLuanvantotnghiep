<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminProductImageTest extends TestCase
{
    use RefreshDatabase;

    /** Admin có thể thay nhiều ảnh; ảnh đầu tiên là ảnh chính và file cũ bị xóa. */
    public function test_admin_can_replace_product_images_and_old_files_are_deleted(): void
    {
        Storage::fake('public');
        $product = $this->product();
        Storage::disk('public')->put('products/old.png', 'old-image');
        $product->images()->create(['image' => 'products/old.png', 'is_primary' => true, 'sort_order' => 1]);

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->postJson("/api/admin/products/{$product->id}/images", [
                'images' => [
                    UploadedFile::fake()->image('front.jpg', 800, 1000)->size(4096),
                    UploadedFile::fake()->image('back.webp', 800, 1000),
                ],
            ])->assertOk()->assertJsonCount(2, 'data.images')
            ->assertJsonPath('data.images.0.is_primary', true)
            ->assertJsonPath('data.images.1.is_primary', false);

        Storage::disk('public')->assertMissing('products/old.png');
        $images = $product->images()->orderBy('sort_order')->get();
        $this->assertCount(2, $images);
        Storage::disk('public')->assertExists($images[0]->image);
        Storage::disk('public')->assertExists($images[1]->image);
    }

    /** Khi xóa ảnh chính, file bị xóa và ảnh kế tiếp tự trở thành ảnh chính. */
    public function test_deleting_primary_image_promotes_next_image(): void
    {
        Storage::fake('public');
        $product = $this->product();
        $first = $this->image($product, 'products/first.png', true, 1);
        $second = $this->image($product, 'products/second.png', false, 2);

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->deleteJson("/api/admin/products/{$product->id}/images/{$first->id}")
            ->assertOk()->assertJsonCount(1, 'data.images')
            ->assertJsonPath('data.images.0.id', $second->id)
            ->assertJsonPath('data.images.0.is_primary', true);

        Storage::disk('public')->assertMissing('products/first.png');
        Storage::disk('public')->assertExists('products/second.png');
        $this->assertDatabaseHas('product_images', ['id' => $second->id, 'is_primary' => true, 'sort_order' => 1]);
    }

    /** Xóa sản phẩm cũng xóa toàn bộ file ảnh còn lại khỏi disk public. */
    public function test_deleting_product_removes_its_image_files(): void
    {
        Storage::fake('public');
        $product = $this->product();
        $this->image($product, 'products/product.png', true, 1);

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->deleteJson("/api/admin/products/{$product->id}")->assertOk();

        Storage::disk('public')->assertMissing('products/product.png');
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    /** Tạo sản phẩm tối thiểu cho các tình huống quản lý ảnh. */
    private function product(): Product
    {
        $category = Category::query()->firstOrCreate(['slug' => 'ao-quan'], ['name' => 'Áo quần', 'status' => 'active']);

        return Product::query()->create([
            'category_id' => $category->id, 'name' => 'Áo hình ảnh', 'slug' => 'ao-hinh-anh',
            'base_price' => 250000, 'status' => Product::STATUS_ACTIVE, 'featured' => false,
        ]);
    }

    /** Tạo bản ghi và file ảnh giả trong public disk. */
    private function image(Product $product, string $path, bool $isPrimary, int $sortOrder): ProductImage
    {
        Storage::disk('public')->put($path, 'image-content');

        return $product->images()->create(['image' => $path, 'is_primary' => $isPrimary, 'sort_order' => $sortOrder]);
    }
}
