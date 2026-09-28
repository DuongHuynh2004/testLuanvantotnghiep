<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    /**
     * Chuyển Order sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'subtotal' => $this->subtotal,
            'shipping_fee' => $this->shipping_fee,
            'discount' => $this->discount,
            'coupon_code' => $this->coupon_code,
            'total' => $this->total,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'shipping_name' => $this->shipping_name,
            'shipping_phone' => $this->shipping_phone,
            'shipping_address' => $this->shipping_address,
            'note' => $this->note,
            'created_at' => $this->created_at,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'requests' => $this->whenLoaded('requests', fn () => $this->requests->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->type,
                'status' => $item->status,
                'reason' => $item->reason,
                'admin_note' => $item->admin_note,
                'resolved_at' => $item->resolved_at,
                'created_at' => $item->created_at,
            ])),
            'reviews' => $this->whenLoaded('reviews', fn () => $this->reviews->map(fn ($review) => [
                'id' => $review->id,
                'product_id' => $review->product_id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at,
            ])),
        ];
    }
}
