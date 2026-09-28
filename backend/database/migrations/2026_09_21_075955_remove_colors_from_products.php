<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('product_variants', 'color_id')) {
            DB::transaction(function () {
                foreach (DB::table('products')->pluck('id') as $productId) {
                    $variantsBySize = DB::table('product_variants')
                        ->where('product_id', $productId)
                        ->orderBy('id')
                        ->get()
                        ->groupBy('size_id');

                    foreach ($variantsBySize as $sizeId => $variants) {
                        $keeper = $variants->first();
                        $retiredIds = $variants->skip(1)->pluck('id');

                        foreach (DB::table('cart_items')->whereIn('product_variant_id', $retiredIds)->get() as $cartItem) {
                            $existing = DB::table('cart_items')
                                ->where('cart_id', $cartItem->cart_id)
                                ->where('product_variant_id', $keeper->id)
                                ->first();

                            if ($existing) {
                                DB::table('cart_items')->where('id', $existing->id)->update([
                                    'quantity' => $existing->quantity + $cartItem->quantity,
                                    'updated_at' => now(),
                                ]);
                                DB::table('cart_items')->where('id', $cartItem->id)->delete();
                            } else {
                                DB::table('cart_items')->where('id', $cartItem->id)->update([
                                    'product_variant_id' => $keeper->id,
                                    'updated_at' => now(),
                                ]);
                            }
                        }

                        DB::table('product_variants')->whereIn('id', $retiredIds)->delete();
                        DB::table('product_variants')->where('id', $keeper->id)->update([
                            'sku' => "SKU-{$productId}-{$sizeId}",
                            'stock_quantity' => $variants->sum('stock_quantity'),
                            'updated_at' => now(),
                        ]);
                    }
                }
            });

            $hasProductIndex = collect(Schema::getIndexes('product_variants'))
                ->contains(fn (array $index): bool => $index['name'] === 'product_variants_product_id_index');

            if (! $hasProductIndex) {
                Schema::table('product_variants', fn (Blueprint $table) => $table->index('product_id'));
            }

            Schema::table('product_variants', fn (Blueprint $table) => $table->dropForeign(['color_id']));
            Schema::table('product_variants', fn (Blueprint $table) => $table->dropUnique('product_variants_product_id_color_id_size_id_unique'));
            Schema::table('product_variants', fn (Blueprint $table) => $table->dropColumn('color_id'));
        }

        Schema::dropIfExists('colors');

        $hasProductSizeIndex = collect(Schema::getIndexes('product_variants'))
            ->contains(fn (array $index): bool => $index['name'] === 'product_variants_product_id_size_id_unique');

        if (! $hasProductSizeIndex) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->unique(['product_id', 'size_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        throw new RuntimeException('Không thể khôi phục màu và các biến thể màu đã gộp. Hãy dùng bản sao lưu trước migration.');
    }
};
