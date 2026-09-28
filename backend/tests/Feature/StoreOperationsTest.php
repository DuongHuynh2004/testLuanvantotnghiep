<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoreOperationsTest extends TestCase
{
    use RefreshDatabase;

    /** Kiểm tra luồng mua từ giỏ giữ đúng giá server, trừ tồn kho và xóa các dòng đã đặt. */
    public function test_cart_checkout_preserves_server_prices_and_stock(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->createVariant();
        $this->postJson('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 2])
            ->assertCreated()->assertJsonPath('data.item_count', 2)->assertJsonPath('data.subtotal', 300000);
        $this->postJson('/api/orders', $this->shippingDetails())
            ->assertCreated()->assertJsonPath('data.total', '300000.00')->assertJsonCount(1, 'data.items');
        $this->assertSame(3, $variant->fresh()->stock_quantity);
        $this->getJson('/api/cart')->assertOk()->assertJsonCount(0, 'data.items');
        $this->assertDatabaseHas('order_items', ['product_variant_id' => $variant->id, 'variant_name' => 'M', 'quantity' => 2]);
    }

    /** Kiểm tra mua ngay không xóa giỏ hàng và từ chối đơn vượt tồn kho. */
    public function test_buy_now_keeps_cart_and_rejects_insufficient_stock(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $variant = $this->createVariant();
        $this->postJson('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->assertCreated();
        $payload = [...$this->shippingDetails(), 'items' => [['variant_id' => $variant->id, 'quantity' => 2]]];
        $this->postJson('/api/orders', $payload)->assertCreated();
        $this->getJson('/api/cart')->assertOk()->assertJsonPath('data.item_count', 1);
        $payload['items'][0]['quantity'] = 4;
        $this->postJson('/api/orders', $payload)->assertUnprocessable();
        $this->assertSame(3, $variant->fresh()->stock_quantity);
        $this->assertDatabaseCount('orders', 1);
    }

    /** Kiểm tra tối ưu truy vấn địa chỉ vẫn giữ duy nhất một mặc định cho từng người dùng. */
    public function test_default_address_is_scoped_to_its_owner(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $details = ['receiver_name' => 'Test', 'phone' => '0900000000', 'province' => 'HCM', 'district' => 'Q1', 'ward' => 'P1', 'address_detail' => '123 Test'];
        $otherAddress = Address::query()->create([...$details, 'user_id' => $otherUser->id, 'is_default' => true]);
        Sanctum::actingAs($user);
        $first = $this->postJson('/api/addresses', $details)->assertCreated()->assertJsonPath('data.is_default', true)->json('data.id');
        $second = $this->postJson('/api/addresses', [...$details, 'is_default' => true])->assertCreated()->json('data.id');
        $this->assertDatabaseHas('addresses', ['id' => $first, 'is_default' => false]);
        $this->assertDatabaseHas('addresses', ['id' => $second, 'is_default' => true]);
        $this->assertDatabaseHas('addresses', ['id' => $otherAddress->id, 'is_default' => true]);
        $this->patchJson('/api/addresses/'.$first, [...$details, 'is_default' => true])->assertOk();
        $this->assertDatabaseHas('addresses', ['id' => $second, 'is_default' => false]);
        $this->deleteJson('/api/addresses/'.$first)->assertOk();
        $this->assertDatabaseHas('addresses', ['id' => $second, 'is_default' => true]);
        $this->deleteJson('/api/addresses/'.$otherAddress->id)->assertNotFound();
        $this->assertDatabaseHas('addresses', ['id' => $otherAddress->id]);
    }

    /** Kiểm tra đăng ký phát token, lưu mật khẩu đã băm và chặn khách vào giỏ hàng. */
    public function test_authentication_contract_remains_available(): void
    {
        $this->getJson('/api/cart')->assertUnauthorized();
        $result = $this->postJson('/api/register', ['name' => 'Test user', 'email' => 'test@example.com', 'password' => 'Password123!', 'password_confirmation' => 'Password123!'])
            ->assertCreated()->assertJsonPath('data.user.role', 'customer')->assertJsonStructure(['data' => ['token']]);
        $this->assertNotSame('Password123!', User::query()->where('email', 'test@example.com')->value('password'));
        $this->withToken($result->json('data.token'))->getJson('/api/user')->assertOk()->assertJsonPath('data.email', 'test@example.com');
    }

    /** Khách được sửa hồ sơ của mình nhưng payload không thể thay đổi vai trò tài khoản. */
    public function test_customer_can_update_profile_without_changing_role(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_CUSTOMER]);
        Sanctum::actingAs($user);

        $this->patchJson('/api/user', [
            'name' => 'Tên mới',
            'email' => 'new-profile@example.com',
            'phone' => '0912345678',
            'role' => User::ROLE_ADMIN,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Tên mới')
            ->assertJsonPath('data.role', User::ROLE_CUSTOMER);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'new-profile@example.com',
            'role' => User::ROLE_CUSTOMER,
        ]);
    }

    /** Khách đăng ngay, sửa và xóa đánh giá của chính mình; đánh giá trùng bị từ chối. */
    public function test_completed_order_exposes_and_accepts_one_product_review(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $variant = $this->createVariant();
        $order = $user->orders()->create([
            ...$this->shippingDetails(),
            'order_code' => 'SNE-REVIEW',
            'subtotal' => 150000,
            'shipping_fee' => 0,
            'discount' => 0,
            'total' => 150000,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);
        $order->items()->create([
            'product_variant_id' => $variant->id,
            'product_name' => $variant->product->name,
            'variant_name' => 'M',
            'price' => 150000,
            'quantity' => 1,
            'subtotal' => 150000,
        ]);

        $this->getJson('/api/orders')->assertOk()
            ->assertJsonPath('data.data.0.items.0.product.slug', 'test-shirt');

        $payload = ['order_id' => $order->id, 'rating' => 5, 'comment' => 'Sản phẩm rất tốt'];
        $reviewId = $this->postJson('/api/products/test-shirt/reviews', $payload)
            ->assertCreated()
            ->assertJsonMissingPath('data.status')
            ->json('data.id');
        $this->assertDatabaseHas('reviews', ['id' => $reviewId, 'status' => 'approved']);
        $this->getJson('/api/products/test-shirt/reviews')
            ->assertOk()
            ->assertJsonPath('data.0.id', $reviewId);
        $this->postJson('/api/products/test-shirt/reviews', $payload)->assertUnprocessable();
        Sanctum::actingAs(User::factory()->create());
        $this->patchJson("/api/reviews/{$reviewId}", ['rating' => 1, 'comment' => 'Không thuộc quyền sở hữu'])
            ->assertNotFound();
        $this->deleteJson("/api/reviews/{$reviewId}")->assertNotFound();
        Sanctum::actingAs($user);
        $this->patchJson("/api/reviews/{$reviewId}", ['rating' => 4, 'comment' => 'Đã cập nhật'])
            ->assertOk()
            ->assertJsonPath('data.rating', 4);
        $this->deleteJson("/api/reviews/{$reviewId}")->assertOk();
        $this->assertDatabaseMissing('reviews', ['id' => $reviewId]);
    }

    /** Tạo một biến thể có giá và tồn kho xác định để kiểm tra luồng mua hàng. */
    private function createVariant(): ProductVariant
    {
        $product = Product::query()->create(['category_id' => Category::query()->where('slug', 'tops')->value('id'), 'name' => 'Test shirt', 'slug' => 'test-shirt', 'base_price' => 150000, 'status' => 'active']);

        return $product->variants()->create(['size_id' => Size::query()->where('name', 'M')->value('id'), 'sku' => 'TEST-M', 'price' => 150000, 'stock_quantity' => 5]);
    }

    /** Trả thông tin giao hàng hợp lệ dùng cho các ca kiểm tra tạo đơn. */
    private function shippingDetails(): array
    {
        return ['shipping_name' => 'Test user', 'shipping_phone' => '0900000000', 'shipping_address' => '123 Test', 'payment_method' => 'cod'];
    }
}
