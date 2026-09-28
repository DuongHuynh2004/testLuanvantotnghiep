<?php

namespace App\Http\Resources;

use App\Models\Combo;
use App\Support\PublicImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Combo */
class ComboResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $originalPrice = round($this->products->sum(fn ($product) => $product->sellingPrice()), 2);
        $discount = round($originalPrice * (float) $this->discount_percent / 100, 2);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'image' => PublicImageUrl::resolve($this->image, $request),
            'discount_percent' => (float) $this->discount_percent,
            'is_active' => (bool) $this->is_active,
            'original_price' => $originalPrice,
            'discount' => $discount,
            'price' => round($originalPrice - $discount, 2),
            'products' => $this->products->map(function ($product) use ($request): array {
                $product->variants->each(fn ($variant) => $variant->setRelation('product', $product));

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'price' => $product->sellingPrice(),
                    'image' => PublicImageUrl::resolve($product->primaryImage?->image, $request),
                    'variants' => $product->variants->map(fn ($variant): array => [
                        'id' => $variant->id,
                        'size' => $variant->size?->name,
                        'stock_quantity' => $variant->stock_quantity,
                    ])->values(),
                ];
            })->values(),
        ];
    }
}
