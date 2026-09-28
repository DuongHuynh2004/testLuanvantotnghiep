<?php

namespace Tests\Feature;

use App\Models\Combo;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\ComboSeeder;
use Database\Seeders\ProductSeeder;
use Database\Seeders\SizeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ComboCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->seed([CategorySeeder::class, SizeSeeder::class, ProductSeeder::class, ComboSeeder::class]);
    }

    /** API combo trả đúng ba bộ, đúng ảnh và tính 5% từ giá bán hiện tại. */
    public function test_combo_catalog_uses_current_product_prices(): void
    {
        $this->getJson('/api/combos')->assertOk()->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.slug', 'combo-1')
            ->assertJsonPath('data.0.original_price', 928000)
            ->assertJsonPath('data.0.discount', 46400)
            ->assertJsonPath('data.0.price', 881600)
            ->assertJsonCount(2, 'data.0.products');

        Storage::disk('public')->assertExists('combos/combo-1.png');
        Storage::disk('public')->assertExists('combos/combo-5.png');
    }

    /** Thêm combo tạo một nhóm hai món; sửa hoặc xóa luôn tác động cả bộ. */
    public function test_combo_cart_keeps_items_grouped(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $combo = $this->comboWithMediumVariants();

        $cart = $this->postJson('/api/cart/combos', [
            'combo_id' => $combo->id,
            'variant_ids' => $combo->products->pluck('variants.0.id')->all(),
            'quantity' => 1,
        ])->assertCreated()->assertJsonPath('data.item_count', 2)
            ->assertJsonPath('data.combo_discount', 46400)
            ->assertJsonPath('data.total', 881600);

        $firstItemId = $cart->json('data.items.0.id');
        $this->patchJson('/api/cart/items/'.$firstItemId, ['quantity' => 2])
            ->assertOk()->assertJsonPath('data.item_count', 4)->assertJsonPath('data.combo_discount', 92800);
        $this->deleteJson('/api/cart/items/'.$firstItemId)
            ->assertOk()->assertJsonPath('data.item_count', 0)->assertJsonPath('data.total', 0);
    }

    /** Combo thêm từ bộ sưu tập phải chọn đủ size trong giỏ trước khi báo giá thanh toán. */
    public function test_combo_size_is_selected_in_cart_before_checkout(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $combo = $this->comboWithMediumVariants();

        $cart = $this->postJson('/api/cart/combos', [
            'combo_id' => $combo->id,
            'quantity' => 1,
        ])->assertCreated()
            ->assertJsonPath('data.requires_size_selection', true)
            ->assertJsonPath('data.items.0.size_confirmed', false);

        $this->postJson('/api/checkout/quote')->assertUnprocessable()
            ->assertJsonPath('message', 'Vui lòng chọn size cho tất cả sản phẩm trong combo.');

        foreach ($cart->json('data.items') as $item) {
            $variantId = collect($item['variant']['available_variants'])
                ->firstWhere('size', 'M')['id'];
            $this->patchJson('/api/cart/items/'.$item['id'].'/variant', ['variant_id' => $variantId])
                ->assertOk();
        }

        $this->getJson('/api/cart')->assertOk()
            ->assertJsonPath('data.requires_size_selection', false);
        $this->postJson('/api/checkout/quote')->assertOk()
            ->assertJsonPath('data.combo_discount', 46400);
    }

    /** Checkout tính giảm combo ở server và lưu dấu combo vào dòng đơn hàng. */
    public function test_combo_discount_is_recalculated_and_saved_on_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $combo = $this->comboWithMediumVariants();
        $variantIds = $combo->products->pluck('variants.0.id')->all();
        $this->postJson('/api/cart/combos', ['combo_id' => $combo->id, 'variant_ids' => $variantIds, 'quantity' => 1])->assertCreated();

        $this->postJson('/api/checkout/quote')->assertOk()
            ->assertJsonPath('data.subtotal', 928000)
            ->assertJsonPath('data.combo_discount', 46400)
            ->assertJsonPath('data.coupon_discount', 0)
            ->assertJsonPath('data.total', 881600);

        $this->postJson('/api/orders', [
            'shipping_name' => 'Combo Test',
            'shipping_phone' => '0900000000',
            'shipping_address' => 'Test address',
            'payment_method' => 'cod',
        ])->assertCreated()->assertJsonPath('data.discount', '46400.00')->assertJsonCount(2, 'data.items');

        $this->assertDatabaseCount('order_items', 2);
        $this->assertDatabaseHas('order_items', ['combo_name' => 'Combo Hoa Cúc Mint']);
        $this->getJson('/api/cart')->assertOk()->assertJsonPath('data.item_count', 0);
    }

    /** Trả combo đầu tiên cùng biến thể size M của mỗi sản phẩm. */
    private function comboWithMediumVariants(): Combo
    {
        return Combo::query()->where('slug', 'combo-1')->with([
            'products.variants' => fn ($query) => $query->whereHas('size', fn ($query) => $query->where('name', 'M')),
        ])->firstOrFail();
    }
}
