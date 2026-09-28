<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Models\User;
use Database\Seeders\CouponSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PromotionCheckoutTest extends TestCase
{
    use RefreshDatabase;

    /** Mã mẫu không tự phát hành và seeder không ghi đè cấu hình đã được chỉnh. */
    public function test_sample_coupon_stays_disabled_and_seeding_is_repeatable(): void
    {
        $this->seed(CouponSeeder::class);
        $this->getJson('/api/coupons')->assertOk()->assertJsonCount(0, 'data');
        $coupon = Coupon::query()->where('code', 'SUNEA10')->firstOrFail();
        $this->assertFalse($coupon->is_active);
        $coupon->update(['minimum_order' => 400000]);
        $this->seed(CouponSeeder::class);
        $this->assertDatabaseCount('coupons', 1);
        $this->assertSame('400000.00', $coupon->fresh()->minimum_order);
    }

    /** Báo giá không giữ chỗ mã: nếu mã hết hạn trước khi đặt, server từ chối đơn. */
    public function test_coupon_is_checked_again_at_checkout_after_preview(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->variant();
        $coupon = Coupon::factory()->create(['ends_at' => now()->addMinute()]);
        $this->postJson('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->assertCreated();
        $this->postJson('/api/checkout/quote', ['coupon_code' => $coupon->code])->assertOk()->assertJsonPath('data.total', 90000);
        $this->travel(2)->minutes();
        $this->postJson('/api/orders', [...$this->shipping(), 'coupon_code' => $coupon->code])->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(10, $variant->fresh()->stock_quantity);
        $this->getJson('/api/cart')->assertOk()->assertJsonPath('data.item_count', 1);
    }

    /** Giá, nhãn và bộ lọc khuyến mãi cùng thay đổi theo thời hạn của sản phẩm. */
    public function test_product_promotion_schedule_is_consistent_across_catalog_and_checkout(): void
    {
        $this->travelTo(now()->startOfSecond());
        $variant = $this->variant();
        $variant->product->update(['sale_price' => 80000, 'promotion_name' => 'Summer', 'promotion_starts_at' => now()->addDay(), 'promotion_ends_at' => now()->addDays(2)]);
        $slug = $variant->product->slug;
        $this->getJson('/api/products/'.$slug)->assertOk()->assertJsonPath('data.price', 100000)->assertJsonPath('data.promotion', null)->assertJsonPath('data.variants.0.price', '100000.00');
        $this->getJson('/api/products?promotion=1')->assertOk()->assertJsonCount(0, 'data.items');
        $this->travel(1)->days();
        $this->getJson('/api/products/'.$slug)->assertOk()->assertJsonPath('data.price', 80000)->assertJsonPath('data.promotion.name', 'Summer')->assertJsonPath('data.variants.0.price', '80000.00');
        $this->getJson('/api/products?promotion=1&sort=price_asc')->assertOk()->assertJsonCount(1, 'data.items');
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/checkout/quote', ['items' => [['variant_id' => $variant->id, 'quantity' => 2]]])->assertOk()->assertJsonPath('data.subtotal', 160000);
        $this->travel(1)->days();
        $this->getJson('/api/products/'.$slug)->assertOk()->assertJsonPath('data.price', 100000)->assertJsonPath('data.promotion', null);
    }

    /** Mã được cộng sau giá ưu đãi, có trần giảm; client không thể tự thay đổi số tiền phải trả. */
    public function test_coupon_quote_and_order_use_server_prices_and_keep_snapshots(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->variant();
        $variant->product->update(['sale_price' => 80000, 'promotion_name' => 'Summer']);
        $coupon = Coupon::factory()->create(['code' => 'SUMMER20', 'discount_value' => 20, 'minimum_order' => 100000, 'maximum_discount' => 25000]);
        $items = [['variant_id' => $variant->id, 'quantity' => 2]];
        $this->postJson('/api/checkout/quote', ['items' => $items, 'coupon_code' => ' summer20 '])->assertOk()
            ->assertJsonPath('data.subtotal', 160000)->assertJsonPath('data.discount', 25000)->assertJsonPath('data.total', 135000);
        $this->assertSame(0, $coupon->orders()->count());
        $this->assertSame(10, $variant->fresh()->stock_quantity);
        $this->postJson('/api/orders', [...$this->shipping(), 'items' => $items, 'coupon_code' => 'summer20', 'total' => 1, 'discount' => 999999])->assertCreated()
            ->assertJsonPath('data.total', '135000.00')->assertJsonPath('data.coupon_code', 'SUMMER20');
        $this->assertSame(8, $variant->fresh()->stock_quantity);
        $coupon->update(['code' => 'NEWCODE', 'discount_value' => 1]);
        $variant->product->update(['sale_price' => null]);
        $this->getJson('/api/orders')->assertOk()->assertJsonPath('data.data.0.coupon_code', 'SUMMER20')->assertJsonPath('data.data.0.discount', '25000.00')->assertJsonPath('data.data.0.items.0.price', '80000.00');
    }

    /** Mã cố định không thể làm tổng tiền âm; một lượt dùng chỉ được ghi khi tạo đơn. */
    public function test_usage_limit_and_fixed_discount_floor_are_enforced(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->variant();
        $coupon = Coupon::factory()->create(['discount_type' => 'fixed', 'discount_value' => 200000, 'usage_limit' => 1]);
        $payload = [...$this->shipping(), 'items' => [['variant_id' => $variant->id, 'quantity' => 1]], 'coupon_code' => $coupon->code];
        $this->postJson('/api/orders', $payload)->assertCreated()->assertJsonPath('data.total', '0.00')->assertJsonPath('data.discount', '100000.00');
        $this->postJson('/api/orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('coupon_code', 'errors');
        $this->assertDatabaseCount('orders', 1);
        $this->assertSame(9, $variant->fresh()->stock_quantity);
        $this->getJson('/api/coupons')->assertOk()->assertJsonCount(0, 'data');
    }

    /** Giới hạn theo khách độc lập với giới hạn tổng, khách khác vẫn dùng được mã. */
    public function test_per_customer_limit_does_not_block_other_customers(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->variant();
        $coupon = Coupon::factory()->create(['per_user_limit' => 1]);
        $payload = [...$this->shipping(), 'items' => [['variant_id' => $variant->id, 'quantity' => 1]], 'coupon_code' => $coupon->code];
        $this->postJson('/api/orders', $payload)->assertCreated();
        $this->postJson('/api/orders', $payload)->assertUnprocessable();
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/orders', $payload)->assertCreated();
        $this->assertDatabaseCount('orders', 2);
    }

    /** Mã không hợp lệ và đơn chưa đủ điều kiện không tạo đơn hoặc trừ tồn kho. */
    public function test_invalid_coupon_conditions_are_rejected_without_side_effects(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->variant();
        foreach ([['is_active' => false], ['starts_at' => now()->addDay()], ['ends_at' => now()->subDay()], ['minimum_order' => 200000]] as $attributes) {
            $coupon = Coupon::factory()->create($attributes);
            $this->postJson('/api/orders', [...$this->shipping(), 'items' => [['variant_id' => $variant->id, 'quantity' => 1]], 'coupon_code' => $coupon->code])->assertUnprocessable();
        }
        $this->postJson('/api/checkout/quote', ['items' => [['variant_id' => $variant->id, 'quantity' => 1]], 'coupon_code' => 'UNKNOWN'])->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(10, $variant->fresh()->stock_quantity);
    }

    /** Gộp dòng trùng trước khi kiểm tra kho, không cho đặt sản phẩm đã ẩn. */
    public function test_duplicate_variants_and_inactive_products_cannot_bypass_stock_checks(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->variant();
        $items = [['variant_id' => $variant->id, 'quantity' => 6], ['variant_id' => $variant->id, 'quantity' => 6]];
        $this->postJson('/api/orders', [...$this->shipping(), 'items' => $items])->assertUnprocessable();
        $variant->product->update(['status' => 'inactive']);
        $this->postJson('/api/orders', [...$this->shipping(), 'items' => [['variant_id' => $variant->id, 'quantity' => 1]]])->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(10, $variant->fresh()->stock_quantity);
    }

    /** Chỉ quản trị được phát hành mã/gắn ưu đãi; cấu hình sai bị từ chối. */
    public function test_admin_can_manage_promotions_and_coupons_with_validation(): void
    {
        $variant = $this->variant();
        $this->getJson('/api/admin/promotions')->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        $this->getJson('/api/admin/promotions')->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/promotions')->assertOk();
        $url = '/api/admin/products/'.$variant->product_id.'/promotion';
        $this->patchJson($url, ['sale_price' => 120000])->assertUnprocessable();
        $this->patchJson($url, ['sale_price' => 90000, 'promotion_starts_at' => now()->addDays(2)->toISOString(), 'promotion_ends_at' => now()->addDay()->toISOString()])->assertUnprocessable();
        $this->patchJson($url, ['sale_price' => 90000, 'promotion_name' => 'Test', 'promotion_ends_at' => now()->addDay()->toISOString()])->assertOk();
        $this->assertSame('90000.00', $variant->fresh()->price);
        $payload = ['code' => ' new10 ', 'name' => 'New', 'discount_type' => 'percent', 'discount_value' => 10, 'minimum_order' => 0, 'is_active' => true, 'ends_at' => now()->addDay()->toISOString()];
        $result = $this->postJson('/api/admin/coupons', $payload)->assertCreated()->assertJsonPath('data.code', 'NEW10');
        $this->postJson('/api/admin/coupons', $payload)->assertUnprocessable();
        $this->putJson('/api/admin/coupons/'.$result->json('data.id'), [...$payload, 'discount_value' => 101])->assertUnprocessable();
        $this->putJson('/api/admin/coupons/'.$result->json('data.id'), [...$payload, 'is_active' => false])->assertOk();
        $this->getJson('/api/coupons')->assertOk()->assertJsonCount(0, 'data');
        $this->deleteJson('/api/admin/coupons/'.$result->json('data.id'))->assertOk();
        $this->assertDatabaseMissing('coupons', ['id' => $result->json('data.id')]);
        $this->patchJson($url, ['sale_price' => null])->assertOk();
        $this->assertSame('100000.00', $variant->fresh()->price);
    }

    /** Migration bỏ bảng trống, giữ dữ liệu đơn và chuyển giá lặp thành giá kế thừa. */
    public function test_database_normalization_preserves_existing_catalog(): void
    {
        $migration = require database_path('migrations/2026_09_20_173609_add_promotions_and_coupons.php');
        $migration->down();
        $productId = DB::table('products')->insertGetId(['category_id' => Category::query()->first()->id, 'name' => 'Legacy', 'slug' => 'legacy-promo', 'base_price' => 100000, 'sale_price' => 80000]);
        $variantId = DB::table('product_variants')->insertGetId(['product_id' => $productId, 'size_id' => Size::query()->first()->id, 'sku' => 'LEGACY', 'price' => 80000, 'stock_quantity' => 3]);
        $migration->up();
        $this->assertFalse(Schema::hasTable('payments'));
        $this->assertDatabaseHas('product_variants', ['id' => $variantId, 'price' => null, 'stock_quantity' => 3]);
        $this->assertSame('80000.00', ProductVariant::query()->findOrFail($variantId)->price);
        $this->assertDatabaseHas('products', ['id' => $productId, 'sale_price' => 80000]);
    }

    /** Tạo biến thể kế thừa giá với tồn kho xác định. */
    private function variant(): ProductVariant
    {
        $product = Product::query()->create(['category_id' => Category::query()->where('slug', 'tops')->value('id'), 'name' => 'Promotion shirt', 'slug' => 'promotion-shirt', 'base_price' => 100000, 'status' => 'active']);

        return $product->variants()->create(['size_id' => Size::query()->where('name', 'M')->value('id'), 'sku' => 'PROMO-M', 'price' => null, 'stock_quantity' => 10]);
    }

    /** Dữ liệu giao hàng hợp lệ dùng chung cho kiểm thử đặt hàng. */
    private function shipping(): array
    {
        return ['shipping_name' => 'Test', 'shipping_phone' => '0900000000', 'shipping_address' => 'Test address', 'payment_method' => 'cod'];
    }
}
