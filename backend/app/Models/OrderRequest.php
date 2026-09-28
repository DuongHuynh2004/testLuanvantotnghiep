<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['order_id', 'user_id', 'type', 'status', 'reason', 'admin_note', 'resolved_at'])]
class OrderRequest extends Model
{
    public const TYPE_REFUND = 'refund';

    public const TYPE_RETURN = 'return';

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['resolved_at' => 'datetime'];
    }

    /** Đơn hàng liên quan đến yêu cầu hậu mãi. */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** Khách hàng gửi yêu cầu. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
