<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'order_code',
    'subtotal',
    'shipping_fee',
    'discount',
    'total',
    'status',
    'payment_status',
    'payment_method',
    'shipping_name',
    'shipping_phone',
    'shipping_address',
    'note',
    'coupon_id',
    'coupon_code',
])]
class Order extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_SHIPPING = 'shipping';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const PAYMENT_UNPAID = 'unpaid';

    public const PAYMENT_PAID = 'paid';

    public const PAYMENT_FAILED = 'failed';

    public const PAYMENT_REFUNDED = 'refunded';

    public const METHOD_COD = 'cod';

    public const METHOD_BANK_TRANSFER = 'bank_transfer';

    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'shipping_fee' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
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
     * Khai báo quan hệ Eloquent đến các dòng hàng.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Mã ưu đãi gốc; mã và số tiền giảm tại thời điểm đặt vẫn được lưu trên đơn. */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến các đánh giá.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** Các yêu cầu hoàn tiền hoặc đổi trả của khách hàng. */
    public function requests(): HasMany
    {
        return $this->hasMany(OrderRequest::class);
    }
}
