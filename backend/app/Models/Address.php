<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'receiver_name',
    'phone',
    'province',
    'district',
    'ward',
    'address_detail',
    'is_default',
])]
class Address extends Model
{
    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * Khai báo quan hệ Eloquent đến người dùng sở hữu bản ghi.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Ghép địa chỉ chi tiết, phường, quận và tỉnh thành thành chuỗi giao hàng.
     */
    public function fullAddress(): string
    {
        return implode(', ', array_filter([
            $this->address_detail,
            $this->ward,
            $this->district,
            $this->province,
        ]));
    }
}
