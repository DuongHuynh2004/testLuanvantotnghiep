<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /**
     * Trả danh mục đang hoạt động và số sản phẩm đang bán của từng danh mục.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::query()
            ->where('status', Category::STATUS_ACTIVE)
            ->withCount(['products' => fn ($query) => $query->where('status', Product::STATUS_ACTIVE)])
            ->orderBy('name')
            ->get();

        return ApiResponse::success(CategoryResource::collection($categories)->resolve(), 'Categories retrieved');
    }

    /**
     * Kiểm tra bộ lọc, truy vấn sản phẩm đang bán, sắp xếp và phân trang kết quả.
     */
    public function products(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'exists:categories,slug'],
            'featured' => ['nullable', 'boolean'],
            'promotion' => ['nullable', 'boolean'],
            'sort' => ['nullable', 'in:newest,price_asc,price_desc,name'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $products = Product::query()
            ->select('products.*')
            ->selectRaw('CASE WHEN '.Product::PROMOTION_CONDITION.' THEN sale_price ELSE base_price END AS effective_price', [now(), now()])
            ->where('status', Product::STATUS_ACTIVE)
            ->with(['category', 'primaryImage'])
            ->when($validated['search'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('material', 'like', "%{$search}%");
                });
            })
            ->when($validated['category'] ?? null, fn ($query, string $category) => $query->whereHas('category', fn ($query) => $query->where('slug', $category)))
            ->when(array_key_exists('featured', $validated), fn ($query) => $query->where('featured', $validated['featured']))
            ->when($validated['promotion'] ?? false, fn ($query) => $query->whereRaw(Product::PROMOTION_CONDITION, [now(), now()]))
            ->when(($validated['sort'] ?? 'newest') === 'price_asc', fn ($query) => $query->orderBy('effective_price'))
            ->when(($validated['sort'] ?? 'newest') === 'price_desc', fn ($query) => $query->orderByDesc('effective_price'))
            ->when(($validated['sort'] ?? 'newest') === 'name', fn ($query) => $query->orderBy('name'))
            ->when(($validated['sort'] ?? 'newest') === 'newest', fn ($query) => $query->latest())
            ->paginate($validated['per_page'] ?? 12)
            ->withQueryString();

        $payload = ProductResource::collection($products)->response()->getData(true);

        return ApiResponse::success([
            'items' => $payload['data'],
            'pagination' => $payload['meta'],
        ], 'Products retrieved');
    }

    /**
     * Trả chi tiết sản phẩm đang bán cùng ảnh, biến thể và các đánh giá đã duyệt.
     */
    public function show(Product $product): JsonResponse
    {
        abort_if($product->status !== Product::STATUS_ACTIVE, 404);

        $product->load([
            'category',
            'images',
            'variants.size',
            'reviews' => fn ($query) => $query->where('status', Review::STATUS_APPROVED),
            'reviews.user',
        ]);

        $product->variants->each(fn ($variant) => $variant->setRelation('product', $product));

        return ApiResponse::success((new ProductResource($product))->resolve(), 'Product retrieved');
    }
}
