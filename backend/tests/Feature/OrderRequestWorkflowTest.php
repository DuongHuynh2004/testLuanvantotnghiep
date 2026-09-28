<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderRequestWorkflowTest extends TestCase
{
    use RefreshDatabase;

    /** Khách có thể hủy đơn chưa thanh toán của mình và tồn kho được hoàn lại đúng một lần. */
    public function test_customer_can_cancel_eligible_order_and_restore_stock(): void
    {
        $customer = User::factory()->create();
        $otherCustomer = User::factory()->create();
        $variant = $this->variant(stock: 7);
        $order = $this->order($customer);
        $order->items()->create(['product_variant_id' => $variant->id, 'product_name' => 'Áo', 'variant_name' => 'M', 'price' => 100000, 'quantity' => 2, 'subtotal' => 200000]);

        $this->actingAs($otherCustomer, 'sanctum')->patchJson("/api/orders/{$order->id}/cancel")->assertNotFound();
        $this->actingAs($customer, 'sanctum')->patchJson("/api/orders/{$order->id}/cancel")
            ->assertOk()->assertJsonPath('data.status', Order::STATUS_CANCELLED);

        $this->assertSame(9, $variant->fresh()->stock_quantity);
        $this->patchJson("/api/orders/{$order->id}/cancel")->assertUnprocessable();
        $this->assertSame(9, $variant->fresh()->stock_quantity);
    }

    /** Hoàn tiền chỉ áp dụng cho đơn đã trả; đổi trả chỉ áp dụng cho đơn hoàn tất. */
    public function test_customer_requests_follow_order_rules_and_admin_can_resolve_them(): void
    {
        $customer = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $order = $this->order($customer, Order::STATUS_COMPLETED, Order::PAYMENT_PAID);

        $this->actingAs($customer, 'sanctum')->postJson("/api/orders/{$order->id}/requests", ['type' => 'refund', 'reason' => 'Tôi chưa nhận được đúng sản phẩm.'])
            ->assertCreated()->assertJsonPath('data.status', 'pending');
        $this->postJson("/api/orders/{$order->id}/requests", ['type' => 'refund', 'reason' => 'Gửi yêu cầu trùng lần nữa.'])->assertUnprocessable();
        $returnRequest = $this->postJson("/api/orders/{$order->id}/requests", ['type' => 'return', 'reason' => 'Tôi cần đổi sang size khác.'])
            ->assertCreated()->json('data');

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/order-requests?status=pending')->assertOk()->assertJsonCount(2, 'data.data');
        $this->patchJson('/api/admin/order-requests/'.$returnRequest['id'], ['status' => 'approved', 'admin_note' => 'Đã tiếp nhận đổi hàng.'])
            ->assertOk()->assertJsonPath('data.status', 'approved')->assertJsonPath('data.admin_note', 'Đã tiếp nhận đổi hàng.');
    }

    /** Admin tạo sản phẩm có đúng bốn size và có thể xóa lại sản phẩm. */
    public function test_admin_can_create_and_delete_product_with_four_sizes(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::query()->firstOrCreate(['slug' => 'ao-quan'], ['name' => 'Áo quần', 'status' => 'active']);
        foreach (['S', 'M', 'L', 'XL'] as $index => $size) {
            Size::query()->firstOrCreate(['name' => $size], ['sort_order' => $index + 1]);
        }

        $productId = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Áo mới', 'base_price' => 250000, 'category_id' => $category->id,
            'status' => 'active', 'featured' => false, 'stocks' => ['S' => 1, 'M' => 2, 'L' => 3, 'XL' => 4],
        ])->assertCreated()->assertJsonCount(4, 'data.variants')->json('data.id');

        $this->assertDatabaseCount('product_variants', 4);
        $this->deleteJson("/api/admin/products/{$productId}")->assertOk();
        $this->assertDatabaseMissing('products', ['id' => $productId]);
    }

    /** Tạo biến thể sản phẩm tối thiểu để kiểm tra hoàn tồn kho. */
    private function variant(int $stock): ProductVariant
    {
        $category = Category::query()->firstOrCreate(['slug' => 'ao-quan'], ['name' => 'Áo quần', 'status' => 'active']);
        $size = Size::query()->firstOrCreate(['name' => 'M'], ['sort_order' => 2]);
        $product = Product::query()->create(['category_id' => $category->id, 'name' => 'Áo', 'slug' => 'ao', 'base_price' => 100000, 'status' => 'active']);

        return $product->variants()->create(['size_id' => $size->id, 'sku' => 'AO-M', 'price' => null, 'stock_quantity' => $stock]);
    }

    /** Tạo đơn với trạng thái chỉ định cho các tình huống hậu mãi. */
    private function order(User $user, string $status = Order::STATUS_PENDING, string $payment = Order::PAYMENT_UNPAID): Order
    {
        return Order::query()->create([
            'user_id' => $user->id, 'order_code' => 'DH'.fake()->unique()->numerify('######'),
            'subtotal' => 200000, 'shipping_fee' => 0, 'discount' => 0, 'total' => 200000,
            'status' => $status, 'payment_status' => $payment, 'payment_method' => Order::METHOD_COD,
            'shipping_name' => $user->name, 'shipping_phone' => '0900000000', 'shipping_address' => 'TP HCM',
        ]);
    }
}
