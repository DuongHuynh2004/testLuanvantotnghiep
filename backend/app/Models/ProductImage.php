<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'image', 'is_primary', 'sort_order'])]
class ProductImage extends Model
{
    /**
     * Khai báo ép kiểu thuộc tính khi đọc và ghi dữ liệu bằng Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Khai báo quan hệ Eloquent đến sản phẩm của bản ghi.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
