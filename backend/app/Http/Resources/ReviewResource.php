<?php

namespace App\Http\Resources;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class ReviewResource extends JsonResource
{
    /**
     * Chuyển Review sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'author' => $this->whenLoaded('user', $this->user?->name),
            'author_email' => $this->whenLoaded('user', $this->user?->email),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ]),
            'order_code' => $this->whenLoaded('order', $this->order?->order_code),
            'created_at' => $this->created_at,
        ];
    }
}
