<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasIndex('cart_items', 'cart_items_cart_lookup')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->index('cart_id', 'cart_items_cart_lookup');
            });
        }

        if (! Schema::hasIndex('cart_items', 'cart_items_product_variant_lookup')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->index('product_variant_id', 'cart_items_product_variant_lookup');
            });
        }

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique(['cart_id', 'product_variant_id']);
            $table->foreignId('combo_id')->nullable()->after('product_variant_id')->constrained()->nullOnDelete();
            $table->uuid('combo_group')->nullable()->after('combo_id')->index();
            $table->unique(['cart_id', 'product_variant_id', 'combo_group']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('combo_name')->nullable()->after('variant_name');
            $table->uuid('combo_group')->nullable()->after('combo_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['combo_name', 'combo_group']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique(['cart_id', 'product_variant_id', 'combo_group']);
            $table->dropConstrainedForeignId('combo_id');
            $table->dropColumn('combo_group');
            $table->unique(['cart_id', 'product_variant_id']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex('cart_items_cart_lookup');
            $table->dropIndex('cart_items_product_variant_lookup');
        });
    }
};
