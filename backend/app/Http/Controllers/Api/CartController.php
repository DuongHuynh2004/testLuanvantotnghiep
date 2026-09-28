<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartItemResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Combo;
use App\Models\ProductVariant;
use App\Services\ComboPricingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function __construct(private ComboPricingService $comboPricing) {}

    /**
     * Lấy hoặc tạo giỏ hàng của người dùng rồi trả các dòng hàng và tổng tiền.
     */
    public function show(Request $request): JsonResponse
    {
        $cart = $this->cart($request);

        return ApiResponse::success($this->payload($cart), 'Cart retrieved');
    }

    /**
     * Thêm biến thể vào giỏ, cộng số lượng nếu đã có và kiểm tra giới hạn tồn kho.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $variant = ProductVariant::query()->findOrFail($validated['variant_id']);
        $cart = $this->cart($request);
        $item = $cart->items()->firstOrNew(['product_variant_id' => $variant->id, 'combo_id' => null, 'combo_group' => null]);
        $quantity = $item->exists ? $item->quantity + $validated['quantity'] : $validated['quantity'];

        abort_if($quantity > $variant->stock_quantity, 422, 'Số lượng sản phẩm vượt quá tồn kho.');

        $item->quantity = $quantity;
        $item->save();

        return ApiResponse::success($this->payload($cart->fresh()), 'Added to cart', 201);
    }

    /** Thêm trọn bộ combo; size được xác nhận ngay nếu client gửi biến thể, nếu không sẽ chọn tại giỏ hàng. */
    public function storeCombo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'combo_id' => ['required', 'integer', 'exists:combos,id'],
            'variant_ids' => ['sometimes', 'array', 'min:2', 'max:10'],
            'variant_ids.*' => ['required', 'integer', 'distinct', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);
        $combo = Combo::query()->with('products.variants.product')->findOrFail($validated['combo_id']);
        abort_unless($combo->is_active, 422, 'Combo đã ngừng bán.');
        $sizeConfirmed = isset($validated['variant_ids']);
        if ($sizeConfirmed) {
            $variants = ProductVariant::query()->with('product')->whereIn('id', $validated['variant_ids'])->get();
            $expectedProductIds = $combo->products->pluck('id')->sort()->values()->all();
            $actualProductIds = $variants->pluck('product_id')->sort()->values()->all();
            abort_unless($variants->count() === count($validated['variant_ids']) && $actualProductIds === $expectedProductIds, 422, 'Size đã chọn không thuộc đủ sản phẩm của combo.');
        } else {
            $variants = $combo->products->map(function ($product) use ($validated) {
                $variant = $product->variants->first(fn (ProductVariant $variant): bool => $variant->stock_quantity >= $validated['quantity']);
                abort_unless($variant, 422, "Sản phẩm {$product->name} trong combo đang hết hàng.");

                return $variant;
            });
        }

        foreach ($variants as $variant) {
            abort_if($variant->product->status !== 'active' || $validated['quantity'] > $variant->stock_quantity, 422, 'Một sản phẩm trong combo không còn đủ hàng.');
        }

        $cart = $this->cart($request);
        $group = (string) Str::uuid();
        DB::transaction(function () use ($cart, $combo, $group, $variants, $validated, $sizeConfirmed): void {
            foreach ($variants as $variant) {
                $cart->items()->create([
                    'product_variant_id' => $variant->id,
                    'combo_id' => $combo->id,
                    'combo_group' => $group,
                    'quantity' => $validated['quantity'],
                    'size_confirmed' => $sizeConfirmed,
                ]);
            }
        });

        return ApiResponse::success($this->payload($cart->fresh()), 'Combo added to cart', 201);
    }

    /** Đổi size của một món trong giỏ và đánh dấu lựa chọn đã được khách xác nhận. */
    public function updateVariant(Request $request, CartItem $cartItem): JsonResponse
    {
        $validated = $request->validate([
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
        ]);
        $cart = $this->cart($request);
        abort_unless($cartItem->cart_id === $cart->id, 404);
        $cartItem->load('variant');
        $variant = ProductVariant::query()->with('product')->findOrFail($validated['variant_id']);

        abort_unless($variant->product_id === $cartItem->variant->product_id, 422, 'Size không thuộc sản phẩm cần cập nhật.');
        abort_if($variant->product->status !== 'active' || $cartItem->quantity > $variant->stock_quantity, 422, 'Size đã chọn không còn đủ hàng.');

        $cartItem->update([
            'product_variant_id' => $variant->id,
            'size_confirmed' => true,
        ]);

        return ApiResponse::success($this->payload($cart->fresh()), 'Cart size updated');
    }

    /**
     * Kiểm tra quyền sở hữu, tồn kho rồi đổi số lượng dòng hàng.
     */
    public function update(Request $request, CartItem $cartItem): JsonResponse
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:99']]);
        $cart = $this->cart($request);
        abort_unless($cartItem->cart_id === $cart->id, 404);
        if ($cartItem->combo_group) {
            $comboItems = $cart->items()->with('variant')->where('combo_group', $cartItem->combo_group)->get();
            abort_if($comboItems->contains(fn (CartItem $item) => $validated['quantity'] > $item->variant->stock_quantity), 422, 'Một sản phẩm trong combo không đủ tồn kho.');
            $cart->items()->where('combo_group', $cartItem->combo_group)->update(['quantity' => $validated['quantity']]);
        } else {
            abort_if($validated['quantity'] > $cartItem->variant->stock_quantity, 422, 'Số lượng sản phẩm vượt quá tồn kho.');
            $cartItem->update(['quantity' => $validated['quantity']]);
        }

        return ApiResponse::success($this->payload($cart->fresh()), 'Cart updated');
    }

    /**
     * Xóa dòng hàng thuộc giỏ của người dùng hiện tại.
     */
    public function destroy(Request $request, CartItem $cartItem): JsonResponse
    {
        $cart = $this->cart($request);
        abort_unless($cartItem->cart_id === $cart->id, 404);
        if ($cartItem->combo_group) {
            $cart->items()->where('combo_group', $cartItem->combo_group)->delete();
        } else {
            $cartItem->delete();
        }

        return ApiResponse::success($this->payload($cart->fresh()), 'Item removed');
    }

    /**
     * Lấy giỏ hàng của người dùng hoặc tạo một giỏ rỗng nếu chưa có.
     */
    private function cart(Request $request): Cart
    {
        return $request->user()->cart()->firstOrCreate();
    }

    /**
     * Tải sẵn quan hệ của giỏ và tính số lượng, số sản phẩm khác nhau cùng tổng tiền.
     *
     * @return array{items: mixed, item_count: int, product_count: int, subtotal: float}
     */
    private function payload(Cart $cart): array
    {
        $cart->load('items.variant.product.primaryImage', 'items.variant.product.variants.size', 'items.variant.size', 'items.combo');
        $items = CartItemResource::collection($cart->items)->resolve();
        $subtotal = round($cart->items->sum(fn (CartItem $item) => (float) $item->variant->price * $item->quantity), 2);
        $comboDiscount = $this->comboPricing->discount($cart->items->map(fn (CartItem $item): array => [
            'combo_id' => $item->combo_id,
            'combo_group' => $item->combo_group,
            'product_id' => $item->variant->product_id,
            'quantity' => $item->quantity,
            'subtotal' => round((float) $item->variant->price * $item->quantity, 2),
        ]), false);

        return [
            'items' => $items,
            'item_count' => $cart->items->sum('quantity'),
            'product_count' => $cart->items->map(fn (CartItem $item) => $item->variant->product_id)->unique()->count(),
            'subtotal' => $subtotal,
            'combo_discount' => $comboDiscount,
            'total' => round($subtotal - $comboDiscount, 2),
            'requires_size_selection' => $cart->items->contains(fn (CartItem $item): bool => ! $item->size_confirmed),
        ];
    }
}
