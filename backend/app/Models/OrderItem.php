<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'order_id',
    'product_variant_id',
    'product_name',
    'variant_name',
    'combo_name',
    'combo_group',
    'price',
    'quantity',
    'subtotal',
])]
class OrderItem extends Model
{
    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'quantity' => 'integer',
            'subtotal' => 'decimal:2',
        ];
    }

    /**
     * Khai báo quan hệ Eloquent đến đơn hàng của bản ghi.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến biến thể sản phẩm.
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
