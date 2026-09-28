<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'category_id',
    'name',
    'slug',
    'description',
    'material',
    'base_price',
    'sale_price',
    'promotion_name',
    'promotion_starts_at',
    'promotion_ends_at',
    'status',
    'featured',
])]
class Product extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const PROMOTION_CONDITION = 'sale_price IS NOT NULL AND sale_price < base_price AND (promotion_starts_at IS NULL OR promotion_starts_at <= ?) AND (promotion_ends_at IS NULL OR promotion_ends_at > ?)';

    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'featured' => 'boolean',
            'promotion_starts_at' => 'datetime',
            'promotion_ends_at' => 'datetime',
        ];
    }

    /** Kiểm tra giá khuyến mãi hợp lệ và đang trong thời gian áp dụng. */
    public function hasActivePromotion(): bool
    {
        return $this->sale_price !== null && (float) $this->sale_price < (float) $this->base_price
            && (! $this->promotion_starts_at || $this->promotion_starts_at->lte(now()))
            && (! $this->promotion_ends_at || $this->promotion_ends_at->gt(now()));
    }

    /** Giá bán duy nhất dùng cho danh sách, giỏ hàng và đặt hàng. */
    public function sellingPrice(): float
    {
        return (float) ($this->hasActivePromotion() ? $this->sale_price : $this->base_price);
    }

    /**
     * Khai báo quan hệ Eloquent đến danh mục của sản phẩm.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến các ảnh sản phẩm theo thứ tự hiển thị.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * Khai báo quan hệ Eloquent đến ảnh đại diện của sản phẩm.
     */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    /**
     * Khai báo quan hệ Eloquent đến danh sách biến thể.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /** Các combo đang chứa sản phẩm. */
    public function combos(): BelongsToMany
    {
        return $this->belongsToMany(Combo::class)->withPivot('sort_order')->withTimestamps();
    }

    /**
     * Khai báo quan hệ Eloquent đến các đánh giá.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến các mục yêu thích.
     */
    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }
}
