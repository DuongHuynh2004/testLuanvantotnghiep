<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'product_id', 'order_id', 'rating', 'comment', 'status'])]
class Review extends Model
{
    public const STATUS_APPROVED = 'approved';

    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
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
     * Khai báo quan hệ Eloquent đến sản phẩm của bản ghi.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến đơn hàng của bản ghi.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
