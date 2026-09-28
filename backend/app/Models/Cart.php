<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id'])]
class Cart extends Model
{
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
        return $this->hasMany(CartItem::class);
    }
}
