<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'name', 'discount_type', 'discount_value', 'minimum_order', 'maximum_discount', 'starts_at', 'ends_at', 'usage_limit', 'per_user_limit', 'is_active'])]
class Coupon extends Model
{
    use HasFactory;

    /** Ép kiểu cấu hình mã; giới hạn null nghĩa là không giới hạn. */
    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'discount_value' => 'decimal:2', 'minimum_order' => 'decimal:2', 'maximum_discount' => 'decimal:2', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'usage_limit' => 'integer', 'per_user_limit' => 'integer'];
    }

    /** Lượt dùng được đếm từ đơn hàng, không lưu thêm bộ đếm dễ lệch dữ liệu. */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** Kiểm tra mã có đang bật và nằm trong thời gian hiệu lực hay không. */
    public function isAvailable(): bool
    {
        return $this->is_active && (! $this->starts_at || $this->starts_at->lte(now())) && (! $this->ends_at || $this->ends_at->gt(now()));
    }

    /** Tính giảm theo phần trăm hoặc số tiền, không vượt trần giảm và giá trị đơn. */
    public function discountFor(float $subtotal): float
    {
        $discount = $this->discount_type === 'percent' ? $subtotal * (float) $this->discount_value / 100 : (float) $this->discount_value;

        return round(min($subtotal, $discount, $this->maximum_discount === null ? $subtotal : (float) $this->maximum_discount), 2);
    }
}
