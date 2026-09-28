<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_id', 'size_id', 'sku', 'price', 'stock_quantity'])]
class ProductVariant extends Model
{
    /** Giá null kế thừa sản phẩm; giá riêng của biến thể được giảm cùng tỷ lệ khuyến mãi. */
    public function getPriceAttribute(mixed $value): string
    {
        $product = $this->product;
        $base = $value === null ? (float) $product->base_price : (float) $value;
        $price = $product->hasActivePromotion() && (float) $product->base_price > 0
            ? $base * $product->sellingPrice() / (float) $product->base_price : $base;

        return number_format(round($price, 2), 2, '.', '');
    }

    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock_quantity' => 'integer',
        ];
    }

    /**
     * Khai báo quan hệ Eloquent đến sản phẩm của bản ghi.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến kích cỡ của biến thể.
     */
    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến các dòng giỏ hàng tham chiếu biến thể.
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Khai báo quan hệ Eloquent đến các dòng đơn hàng tham chiếu biến thể.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Trả tên size để lưu thông tin biến thể trong đơn hàng. */
    public function displayName(): string
    {
        return $this->size?->name ?? '';
    }
}
