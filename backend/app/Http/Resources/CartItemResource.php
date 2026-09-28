<?php

namespace App\Http\Resources;

use App\Models\CartItem;
use App\Support\PublicImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CartItem */
class CartItemResource extends JsonResource
{
    /**
     * Chuyển CartItem sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $variant = $this->variant;
        $price = (float) $variant->price;

        return [
            'id' => $this->id,
            'quantity' => $this->quantity,
            'size_confirmed' => $this->size_confirmed,
            'subtotal' => $price * $this->quantity,
            'combo' => $this->combo ? [
                'id' => $this->combo->id,
                'name' => $this->combo->name,
                'discount_percent' => (float) $this->combo->discount_percent,
                'group' => $this->combo_group,
            ] : null,
            'variant' => [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'price' => $variant->price,
                'stock_quantity' => $variant->stock_quantity,
                'product' => [
                    'id' => $variant->product->id,
                    'name' => $variant->product->name,
                    'slug' => $variant->product->slug,
                    'image' => PublicImageUrl::resolve($variant->product->primaryImage?->image, $request),
                ],
                'size' => $variant->size?->name,
                'available_variants' => $variant->product->variants
                    ->filter(fn ($availableVariant): bool => $availableVariant->stock_quantity > 0)
                    ->map(fn ($availableVariant): array => [
                        'id' => $availableVariant->id,
                        'size' => $availableVariant->size?->name,
                        'stock_quantity' => $availableVariant->stock_quantity,
                    ])->values(),
            ],
        ];
    }
}
