<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(private ComboPricingService $comboPricing) {}

    /**
     * Định giá lại bằng dữ liệu server; khi tạo đơn phải gọi trong transaction với khóa bật.
     * Khóa mã trước rồi khóa biến thể/sản phẩm theo ID để hạn chế tranh chấp lượt dùng và tồn kho.
     */
    public function quote(User $user, ?array $requestedItems, ?string $code, bool $lock = false): array
    {
        $coupon = null;
        if ($code !== null && trim($code) !== '') {
            $query = Coupon::query()->where('code', strtoupper(trim($code)));
            $coupon = ($lock ? $query->lockForUpdate() : $query)->first();
            if (! $coupon || ! $coupon->isAvailable()) {
                throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá không tồn tại, chưa có hiệu lực hoặc đã hết hạn.']);
            }
        }
        $cart = null;
        if ($requestedItems === null) {
            $cartQuery = $user->cart();
            $cart = ($lock ? $cartQuery->lockForUpdate() : $cartQuery)->first();
            if ($cart) {
                $itemsQuery = $cart->items()->with('combo');
                $cart->setRelation('items', ($lock ? $itemsQuery->lockForUpdate() : $itemsQuery)->get());
            }
            $source = $cart?->items->map(fn ($item) => [
                'variant_id' => $item->product_variant_id,
                'quantity' => $item->quantity,
                'combo_id' => $item->combo_id,
                'combo_group' => $item->combo_group,
                'combo_name' => $item->combo?->name,
                'size_confirmed' => $item->size_confirmed,
            ]) ?? collect();
        } else {
            $source = collect($requestedItems)->map(fn (array $item): array => [...$item, 'combo_id' => null, 'combo_group' => null, 'combo_name' => null, 'size_confirmed' => true]);
        }
        abort_if($source->isEmpty(), 422, 'Giỏ hàng đang trống.');
        abort_if($source->contains(fn (array $item): bool => ! ($item['size_confirmed'] ?? true)), 422, 'Vui lòng chọn size cho tất cả sản phẩm trong combo.');
        $lines = $source->groupBy(fn (array $item): string => $item['variant_id'].'|'.($item['combo_group'] ?? 'standard'))
            ->map(function (Collection $group): array {
                $line = $group->first();
                $line['quantity'] = $group->sum('quantity');

                return $line;
            })->values();
        $quantities = $lines->groupBy('variant_id')->map(fn (Collection $items) => $items->sum('quantity'));
        $query = ProductVariant::query()->whereIn('id', $quantities->keys())->orderBy('id');
        $variants = ($lock ? $query->lockForUpdate() : $query)->get()->keyBy('id');
        abort_if($variants->count() !== $quantities->count(), 422, 'Một sản phẩm không còn tồn tại.');
        $productsQuery = Product::query()->whereIn('id', $variants->pluck('product_id'))->orderBy('id');
        $products = ($lock ? $productsQuery->lockForUpdate() : $productsQuery)->get()->keyBy('id');
        $variants->load('size');
        $items = [];
        $subtotal = 0;
        foreach ($lines as $line) {
            $variant = $variants[$line['variant_id']];
            $variant->setRelation('product', $products[$variant->product_id]);
            $quantity = (int) $line['quantity'];
            abort_if($variant->product->status !== Product::STATUS_ACTIVE, 422, 'Sản phẩm đã ngừng bán.');
            abort_if($quantity < 1 || $quantity > 99 || $quantities[$variant->id] > $variant->stock_quantity, 422, "Sản phẩm {$variant->sku} không đủ tồn kho hoặc số lượng không hợp lệ.");
            $price = (float) $variant->price;
            $lineSubtotal = round($price * $quantity, 2);
            $subtotal += $lineSubtotal;
            $items[] = [
                'variant' => $variant,
                'quantity' => $quantity,
                'price' => $price,
                'subtotal' => $lineSubtotal,
                'combo_id' => $line['combo_id'],
                'combo_group' => $line['combo_group'],
                'combo_name' => $line['combo_name'],
            ];
        }
        $subtotal = round($subtotal, 2);
        $comboDiscount = $this->comboPricing->discount(collect($items)->map(fn (array $item): array => [
            'combo_id' => $item['combo_id'],
            'combo_group' => $item['combo_group'],
            'product_id' => $item['variant']->product_id,
            'quantity' => $item['quantity'],
            'subtotal' => $item['subtotal'],
        ]));
        $couponBase = round($subtotal - $comboDiscount, 2);
        if ($coupon) {
            if ($couponBase < (float) $coupon->minimum_order) {
                throw ValidationException::withMessages(['coupon_code' => 'Đơn hàng chưa đạt giá trị tối thiểu để dùng mã này.']);
            }
            // Đơn đã tạo vẫn tính lượt dùng khi hủy, tránh tái sử dụng mã bằng cách tạo rồi hủy đơn.
            if (($coupon->usage_limit !== null && $coupon->orders()->count() >= $coupon->usage_limit)
                || ($coupon->per_user_limit !== null && $coupon->orders()->where('user_id', $user->id)->count() >= $coupon->per_user_limit)) {
                throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá đã hết lượt dùng hoặc bạn đã dùng đủ lượt.']);
            }
        }
        $couponDiscount = $coupon?->discountFor($couponBase) ?? 0;
        $discount = round($comboDiscount + $couponDiscount, 2);

        return ['items' => $items, 'cart' => $cart, 'coupon' => $coupon, 'subtotal' => $subtotal, 'combo_discount' => $comboDiscount, 'coupon_discount' => $couponDiscount, 'discount' => $discount, 'shipping_fee' => 0, 'total' => round($subtotal - $discount, 2)];
    }

    /** Chỉ đưa dữ liệu cần hiển thị ra frontend; không gửi model nội bộ hoặc thông tin tài khoản. */
    public function toResponse(array $quote): array
    {
        return [
            'items' => array_map(fn ($item) => [
                'variant_id' => $item['variant']->id, 'product_name' => $item['variant']->product->name,
                'variant_name' => $item['variant']->displayName(), 'quantity' => $item['quantity'],
                'price' => $item['price'], 'subtotal' => $item['subtotal'],
                'combo_name' => $item['combo_name'],
                'combo_group' => $item['combo_group'],
            ], $quote['items']),
            'subtotal' => $quote['subtotal'], 'combo_discount' => $quote['combo_discount'], 'coupon_discount' => $quote['coupon_discount'],
            'discount' => $quote['discount'], 'shipping_fee' => $quote['shipping_fee'],
            'total' => $quote['total'], 'coupon_code' => $quote['coupon']?->code,
        ];
    }
}
