<?php

namespace App\Http\Resources;

use App\Models\OrderItem;
use App\Support\PublicImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OrderItem */
class OrderItemResource extends JsonResource
{
    /**
     * Chuyển OrderItem sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $product = $this->variant?->product;

        return [
            'id' => $this->id,
            'product_name' => $this->product_name,
            'variant_name' => $this->variant_name,
            'combo_name' => $this->combo_name,
            'combo_group' => $this->combo_group,
            'price' => $this->price,
            'quantity' => $this->quantity,
            'subtotal' => $this->subtotal,
            'product' => $product ? [
                'id' => $product->id,
                'slug' => $product->slug,
                'image' => PublicImageUrl::resolve($product->primaryImage?->image, $request),
            ] : null,
        ];
    }
}
