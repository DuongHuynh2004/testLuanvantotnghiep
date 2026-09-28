<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Size;
use App\Models\User;
use App\Support\PublicImageUrl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicImageUrlTest extends TestCase
{
    use RefreshDatabase;

    /** Kiểm tra helper giữ URL CDN và dùng đúng HTTPS, hostname khi disk trả đường dẫn tương đối. */
    public function test_public_urls_support_relative_storage_and_cdn(): void
    {
        $request = Request::create('https://shop.example.test/products');
        Storage::shouldReceive('disk')->with('public')->andReturnSelf();
        Storage::shouldReceive('url')->with('products/a.jpg')->once()->andReturn('/storage/products/a.jpg');
        Storage::shouldReceive('url')->with('products/b.jpg')->once()->andReturn('https://cdn.example.test/b.jpg');
        $this->assertSame('https://shop.example.test/storage/products/a.jpg', PublicImageUrl::resolve('products/a.jpg', $request));
        $this->assertSame('https://cdn.example.test/b.jpg', PublicImageUrl::resolve('products/b.jpg', $request));
        $this->assertNull(PublicImageUrl::resolve(null, $request));
        $this->assertNull(PublicImageUrl::resolve('', $request));
    }

    /** Kiểm tra danh sách, chi tiết và giỏ hàng dùng cùng URL ảnh, kể cả sản phẩm chưa có ảnh. */
    public function test_product_and_cart_resources_share_image_urls(): void
    {
        $product = Product::query()->create(['category_id' => Category::query()->where('slug', 'tops')->value('id'), 'name' => 'Image test', 'slug' => 'image-test', 'base_price' => 100000, 'status' => 'active']);
        $variant = $product->variants()->create(['size_id' => Size::query()->where('name', 'M')->value('id'), 'sku' => 'IMAGE-TEST', 'price' => 100000, 'stock_quantity' => 1]);
        $this->getJson('/api/products')->assertOk()->assertJsonPath('data.items.0.primary_image', null);
        $product->images()->create(['image' => 'products/test.jpg', 'is_primary' => true, 'sort_order' => 1]);
        $imageUrl = $this->getJson('/api/products')->assertOk()->json('data.items.0.primary_image');
        $this->assertNotEmpty($imageUrl);
        $this->getJson('/api/products/image-test')->assertOk()->assertJsonPath('data.images.0.url', $imageUrl);
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->assertCreated()->assertJsonPath('data.items.0.variant.product.image', $imageUrl);
    }
}
