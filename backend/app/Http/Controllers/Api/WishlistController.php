<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /**
     * Trả danh sách sản phẩm yêu thích cùng danh mục và ảnh đại diện.
     */
    public function index(Request $request): JsonResponse
    {
        $products = $request->user()->wishlists()->with('product.category', 'product.primaryImage')->latest()->get()->pluck('product');

        return ApiResponse::success(ProductResource::collection($products)->resolve(), 'Wishlist retrieved');
    }

    /**
     * Lưu sản phẩm đang hoạt động vào yêu thích, không tạo trùng mục đã có.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['product_id' => ['required', 'integer', 'exists:products,id']]);
        $product = Product::query()->where('status', Product::STATUS_ACTIVE)->findOrFail($validated['product_id']);

        $request->user()->wishlists()->firstOrCreate(['product_id' => $product->id]);

        return ApiResponse::success(['product_id' => $product->id, 'saved' => true], 'Product saved');
    }

    /**
     * Bỏ sản phẩm khỏi danh sách yêu thích của người dùng hiện tại.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlists()->where('product_id', $product->id)->delete();

        return ApiResponse::success(['product_id' => $product->id, 'saved' => false], 'Product removed');
    }
}
