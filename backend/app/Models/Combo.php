<?php

namespace App\Models;

use Database\Factories\ComboFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'image', 'discount_percent', 'is_active'])]
class Combo extends Model
{
    /** @use HasFactory<ComboFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['discount_percent' => 'decimal:2', 'is_active' => 'boolean'];
    }

    /** Các sản phẩm cấu thành combo theo thứ tự hiển thị. */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)->withPivot('sort_order')->withTimestamps()->orderByPivot('sort_order');
    }

    /** Các dòng giỏ hàng được mua theo combo. */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
