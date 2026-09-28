<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Chuẩn hóa giá, bỏ bảng thanh toán chưa sử dụng và thêm mã ưu đãi cùng dấu vết trên đơn. */
    public function up(): void
    {
        if (DB::table('payments')->exists()) {
            throw new RuntimeException('Payments contains data; migrate payment records before removing this table.');
        }
        Schema::table('products', function (Blueprint $table) {
            $table->string('promotion_name', 120)->nullable();
            $table->timestamp('promotion_starts_at')->nullable();
            $table->timestamp('promotion_ends_at')->nullable();
            $table->index(['status', 'category_id', 'created_at']);
        });
        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->nullable()->comment('NULL: inherit product price; otherwise a variant-specific base price')->change();
        });
        foreach (DB::table('products')->get() as $product) {
            DB::table('product_variants')->where('product_id', $product->id)
                ->where('price', $product->sale_price ?? $product->base_price)->update(['price' => null]);
            if ($product->sale_price !== null) {
                DB::table('products')->where('id', $product->id)->update(['promotion_name' => 'Ưu đãi sản phẩm']);
            }
        }
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name', 120);
            $table->string('discount_type', 10)->comment('percent or fixed');
            $table->decimal('discount_value', 12, 2);
            $table->decimal('minimum_order', 12, 2)->default(0);
            $table->decimal('maximum_discount', 12, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('per_user_limit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'ends_at']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('coupon_code', 40)->nullable()->comment('Coupon code snapshot at checkout');
            $table->index(['coupon_id', 'user_id']);
            $table->index(['user_id', 'created_at']);
        });
        Schema::drop('payments');
    }

    /** Khôi phục cấu trúc cũ; giá đang hiệu lực được chép lại vào các biến thể kế thừa. */
    public function down(): void
    {
        foreach (DB::table('products')->get() as $product) {
            $active = $product->sale_price !== null
                && ($product->promotion_starts_at === null || $product->promotion_starts_at <= now())
                && ($product->promotion_ends_at === null || $product->promotion_ends_at > now());
            DB::table('product_variants')->where('product_id', $product->id)->whereNull('price')
                ->update(['price' => $active ? $product->sale_price : $product->base_price]);
        }
        Schema::table('product_variants', fn (Blueprint $table) => $table->decimal('price', 12, 2)->nullable(false)->change());
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['coupon_id', 'user_id']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn('coupon_code');
        });
        Schema::dropIfExists('coupons');
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status', 'category_id', 'created_at']);
            $table->dropColumn(['promotion_name', 'promotion_starts_at', 'promotion_ends_at']);
        });
        $migration = require database_path('migrations/2026_09_20_120012_create_payments_table.php');
        $migration->up();
    }
};
