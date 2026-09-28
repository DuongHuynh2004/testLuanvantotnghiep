<?php

namespace App\Http\Resources;

use App\Models\ProductImage;
use App\Support\PublicImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductImage */
class ProductImageResource extends JsonResource
{
    /**
     * Chuyển ProductImage sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => PublicImageUrl::resolve($this->image, $request),
            'is_primary' => $this->is_primary,
            'sort_order' => $this->sort_order,
        ];
    }
}
