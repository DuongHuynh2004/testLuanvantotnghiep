<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'description', 'image', 'status'])]
class Category extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    /**
     * Khai báo quan hệ Eloquent đến danh sách sản phẩm.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
