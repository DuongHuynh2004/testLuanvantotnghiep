<?php

namespace App\Http\Resources;

use App\Models\Product;
use App\Support\PublicImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    /**
     * Chuyển Product sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'material' => $this->material,
            'base_price' => $this->base_price,
            'sale_price' => $this->sale_price,
            'price' => $this->sellingPrice(),
            'promotion' => $this->hasActivePromotion() ? [
                'name' => $this->promotion_name ?: 'Ưu đãi sản phẩm',
                'discount_percent' => (int) round((1 - $this->sellingPrice() / (float) $this->base_price) * 100),
                'ends_at' => $this->promotion_ends_at,
            ] : null,
            'status' => $this->status,
            'featured' => $this->featured,
            'category' => $this->whenLoaded('category', fn () => new CategoryResource($this->category)),
            'primary_image' => $this->whenLoaded('primaryImage', fn () => PublicImageUrl::resolve($this->primaryImage?->image, $request)),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }
}
