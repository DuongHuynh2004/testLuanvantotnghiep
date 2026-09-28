<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\Size;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    /** Khách hàng không được truy cập API dành riêng cho quản trị viên. */
    public function test_customer_cannot_access_admin_dashboard(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertForbidden();
    }

    /** Dashboard tính đúng công việc tồn đọng và chỉ cộng doanh thu đơn hoàn tất. */
    public function test_admin_dashboard_returns_operational_metrics(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();
        [, , $variant] = $this->createProduct(stock: 3);
        $variant->update(['stock_quantity' => 0]);
        $this->createOrder($customer, status: Order::STATUS_COMPLETED, total: 250000);
        $this->createOrder($customer, status: Order::STATUS_PENDING, total: 100000);

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.out_of_stock_variants', 1)
            ->assertJsonPath('data.pending_orders', 1)
            ->assertJsonPath('data.customers', 1)
            ->assertJsonPath('data.revenue', 250000);
    }

    /** Quản trị viên có thể lọc, sửa sản phẩm và cập nhật tồn kho biến thể. */
    public function test_admin_can_manage_product_and_variant_stock(): void
    {
        $admin = User::factory()->admin()->create();
        [$category, $product, $variant] = $this->createProduct();

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/products?search=Ao')
            ->assertOk()->assertJsonPath('data.data.0.id', $product->id);

        $this->patchJson("/api/admin/products/{$product->id}", [
            'name' => 'Áo unisex mới', 'category_id' => $category->id,
            'base_price' => 320000, 'status' => 'inactive', 'featured' => true,
        ])->assertOk()->assertJsonPath('data.status', 'inactive');

        $this->patchJson("/api/admin/variants/{$variant->id}", ['stock_quantity' => 12])
            ->assertOk()->assertJsonPath('data.stock_quantity', 12);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'featured' => true]);
        $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'stock_quantity' => 12]);
    }

    /** Quản trị viên có thể xử lý đơn, xem và xóa đánh giá nhưng không có API duyệt. */
    public function test_admin_can_manage_orders_customers_and_reviews(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create(['name' => 'Khach thu nghiem']);
        [, $product] = $this->createProduct();
        $order = $this->createOrder($customer, status: Order::STATUS_PENDING, total: 180000);
        $review = Review::query()->create([
            'user_id' => $customer->id, 'product_id' => $product->id, 'order_id' => $order->id,
            'rating' => 5, 'comment' => 'Sản phẩm tốt', 'status' => Review::STATUS_APPROVED,
        ]);

        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/orders/{$order->id}/status", [
            'status' => Order::STATUS_PROCESSING, 'payment_status' => Order::PAYMENT_PAID,
        ])->assertOk()->assertJsonPath('data.status', Order::STATUS_PROCESSING)
            ->assertJsonPath('data.payment_status', Order::PAYMENT_PAID);

        $this->getJson('/api/admin/customers?search=Khach')
            ->assertOk()->assertJsonPath('data.data.0.orders_count', 1)
            ->assertJsonPath('data.data.0.completed_spend', 0);
        $this->getJson('/api/admin/reviews')
            ->assertOk()->assertJsonPath('data.data.0.id', $review->id);
        $this->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'rejected'])
            ->assertMethodNotAllowed();
        $this->deleteJson("/api/admin/reviews/{$review->id}")->assertOk();
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    /**
     * Tạo cấu trúc sản phẩm tối thiểu dùng chung cho kiểm thử quản trị.
     *
     * @return array{Category, Product, ProductVariant}
     */
    private function createProduct(int $stock = 5): array
    {
        $category = Category::query()->firstOrCreate(['slug' => 'ao-quan'], ['name' => 'Áo quần', 'status' => 'active']);
        $size = Size::query()->firstOrCreate(['name' => 'M'], ['sort_order' => 2]);
        $product = Product::query()->create([
            'category_id' => $category->id, 'name' => 'Ao thun unisex', 'slug' => 'ao-thun-unisex',
            'base_price' => 300000, 'status' => Product::STATUS_ACTIVE, 'featured' => false,
        ]);
        $variant = ProductVariant::query()->create([
            'product_id' => $product->id, 'size_id' => $size->id,
            'sku' => 'AO-M', 'price' => 300000, 'stock_quantity' => $stock,
        ]);

        return [$category, $product, $variant];
    }

    /** Tạo đơn hàng tối thiểu để kiểm tra thống kê và luồng xử lý. */
    private function createOrder(User $user, string $status, int $total): Order
    {
        return Order::query()->create([
            'user_id' => $user->id, 'order_code' => 'DH'.fake()->unique()->numerify('######'),
            'subtotal' => $total, 'shipping_fee' => 0, 'discount' => 0, 'total' => $total,
            'status' => $status, 'payment_status' => Order::PAYMENT_UNPAID,
            'payment_method' => Order::METHOD_COD, 'shipping_name' => $user->name,
            'shipping_phone' => '0900000000', 'shipping_address' => 'TP HCM',
        ]);
    }
}
