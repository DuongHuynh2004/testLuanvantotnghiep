<?php

namespace App\Http\Resources;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Address */
class AddressResource extends JsonResource
{
    /**
     * Chuyển Address sang cấu trúc dữ liệu công khai của API; chỉ trả các trường khai báo.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receiver_name' => $this->receiver_name,
            'phone' => $this->phone,
            'province' => $this->province,
            'district' => $this->district,
            'ward' => $this->ward,
            'address_detail' => $this->address_detail,
            'full_address' => $this->fullAddress(),
            'is_default' => $this->is_default,
        ];
    }
}
