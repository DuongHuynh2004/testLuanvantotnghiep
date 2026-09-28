<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /**
     * Chuyển User sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'created_at' => $this->created_at,
            'orders_count' => $this->when(isset($this->orders_count), $this->orders_count),
            'completed_spend' => $this->when(
                array_key_exists('completed_spend', $this->resource->getAttributes()),
                $this->completed_spend ?? 0,
            ),
        ];
    }
}
