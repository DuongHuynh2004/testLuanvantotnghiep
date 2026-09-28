<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['cart_id', 'product_variant_id', 'combo_id', 'combo_group', 'quantity', 'size_confirmed'])]
class CartItem extends Model
{
    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'size_confirmed' => 'boolean',
        ];
    }

    /**
     * Khai báo quan hệ Eloquent đến giỏ hàng.
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến biến thể sản phẩm.
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /** Combo áp dụng cho dòng hàng, nếu sản phẩm được mua theo bộ. */
    public function combo(): BelongsTo
    {
        return $this->belongsTo(Combo::class);
    }
}
