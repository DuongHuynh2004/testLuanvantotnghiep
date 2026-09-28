<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComboResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ReviewResource;
use App\Http\Resources\UserResource;
use App\Models\Combo;
use App\Models\Order;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\Size;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class AdminController extends Controller
{
    /**
     * Tổng hợp số sản phẩm, đơn hàng, đơn chờ xử lý và tổng tiền đơn chưa bị hủy.
     */
    public function dashboard(): JsonResponse
    {
        return ApiResponse::success([
            'products' => Product::query()->count(),
            'active_products' => Product::query()->where('status', Product::STATUS_ACTIVE)->count(),
            'low_stock_variants' => ProductVariant::query()->whereBetween('stock_quantity', [1, 5])->count(),
            'out_of_stock_variants' => ProductVariant::query()->where('stock_quantity', 0)->count(),
            'orders' => Order::query()->count(),
            'pending_orders' => Order::query()->where('status', Order::STATUS_PENDING)->count(),
            'customers' => User::query()->where('role', User::ROLE_CUSTOMER)->count(),
            'reviews' => Review::query()->count(),
            'revenue' => Order::query()->where('status', Order::STATUS_COMPLETED)->sum('total'),
            'order_value' => Order::query()->whereNotIn('status', [Order::STATUS_CANCELLED])->sum('total'),
        ], 'Admin dashboard retrieved');
    }

    /**
     * Trả danh sách đơn hàng phân trang cho quản trị viên.
     */
    public function orders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:pending,confirmed,processing,shipping,completed,cancelled'],
            'payment_status' => ['nullable', 'in:unpaid,paid,failed,refunded'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $orders = Order::query()->with(['items', 'requests'])
            ->when($validated['search'] ?? null, fn ($query, string $search) => $query->where(function ($query) use ($search) {
                $query->where('order_code', 'like', "%{$search}%")
                    ->orWhere('shipping_name', 'like', "%{$search}%")
                    ->orWhere('shipping_phone', 'like', "%{$search}%");
            }))
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($validated['payment_status'] ?? null, fn ($query, string $status) => $query->where('payment_status', $status))
            ->latest()->paginate($validated['per_page'] ?? 20)->withQueryString();

        return ApiResponse::success(OrderResource::collection($orders)->response()->getData(true), 'Admin orders retrieved');
    }

    /**
     * Trả danh sách sản phẩm phân trang cùng danh mục và ảnh cho quản trị viên.
     */
    public function products(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'category' => ['nullable', 'string', 'exists:categories,slug'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $products = Product::query()->with(['category', 'primaryImage', 'images', 'variants.product', 'variants.size'])
            ->when($validated['search'] ?? null, fn ($query, string $search) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhereHas('variants', fn ($query) => $query->where('sku', 'like', "%{$search}%"));
            }))
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($validated['category'] ?? null, fn ($query, string $slug) => $query->whereHas('category', fn ($query) => $query->where('slug', $slug)))
            ->latest()->paginate($validated['per_page'] ?? 20)->withQueryString();

        return ApiResponse::success(ProductResource::collection($products)->response()->getData(true), 'Admin products retrieved');
    }

    /** Tạo sản phẩm cùng bốn biến thể size và tồn kho ban đầu. */
    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'material' => ['nullable', 'string', 'max:255'],
            'base_price' => ['required', 'numeric', 'min:0.01', 'max:999999999'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'status' => ['required', 'in:active,inactive'],
            'featured' => ['required', 'boolean'],
            'stocks' => ['required', 'array:S,M,L,XL'],
            'stocks.*' => ['required', 'integer', 'min:0', 'max:1000000'],
        ]);

        $product = DB::transaction(function () use ($validated): Product {
            $product = Product::query()->create([
                ...collect($validated)->except('stocks')->all(),
                'slug' => Str::slug($validated['name']).'-'.Str::lower(Str::random(6)),
            ]);
            foreach (Size::query()->whereIn('name', ['S', 'M', 'L', 'XL'])->get() as $size) {
                $product->variants()->create([
                    'size_id' => $size->id,
                    'sku' => 'SKU-'.$product->id.'-'.$size->id,
                    'price' => null,
                    'stock_quantity' => $validated['stocks'][$size->name],
                ]);
            }

            return $product;
        });

        return ApiResponse::success((new ProductResource($product->load(['category', 'primaryImage', 'images', 'variants.product', 'variants.size'])))->resolve(), 'Product created', 201);
    }

    /**
     * Cập nhật nội dung, giá, danh mục, trạng thái hoặc cờ nổi bật của sản phẩm.
     */
    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'material' => ['sometimes', 'nullable', 'string', 'max:255'],
            'base_price' => ['sometimes', 'numeric', 'min:0.01', 'max:999999999'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'status' => ['sometimes', 'in:active,inactive'],
            'featured' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('base_price', $validated) && $product->sale_price !== null && (float) $validated['base_price'] <= (float) $product->sale_price) {
            return ApiResponse::error('Giá gốc phải lớn hơn giá khuyến mãi hiện tại.', 422, [
                'base_price' => ['Giá gốc phải lớn hơn giá khuyến mãi hiện tại.'],
            ]);
        }

        $product->update($validated);

        return ApiResponse::success((new ProductResource($product->load(['category', 'primaryImage', 'images', 'variants.product', 'variants.size'])))->resolve(), 'Product updated');
    }

    /** Thay toàn bộ ảnh sản phẩm; ảnh đầu tiên là ảnh chính và file cũ bị xóa sau khi lưu thành công. */
    public function replaceProductImages(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:6'],
            'images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp'],
        ]);
        $storedPaths = [];

        try {
            foreach ($validated['images'] as $image) {
                $storedPaths[] = $image->store('products', 'public');
            }

            $oldPaths = DB::transaction(function () use ($product, $storedPaths): array {
                $oldPaths = $product->images()->pluck('image')->all();
                $product->images()->delete();

                foreach ($storedPaths as $index => $path) {
                    $product->images()->create([
                        'image' => $path,
                        'is_primary' => $index === 0,
                        'sort_order' => $index + 1,
                    ]);
                }

                return $oldPaths;
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }

        Storage::disk('public')->delete(array_values(array_diff($oldPaths, $storedPaths)));

        return ApiResponse::success((new ProductResource($product->fresh()->load(['category', 'primaryImage', 'images', 'variants.product', 'variants.size'])))->resolve(), 'Product images replaced');
    }

    /** Xóa một ảnh và tự chọn ảnh còn lại đầu tiên làm ảnh chính. */
    public function destroyProductImage(Product $product, ProductImage $productImage): JsonResponse
    {
        abort_unless($productImage->product_id === $product->id, 404);
        $path = $productImage->image;

        DB::transaction(function () use ($product, $productImage): void {
            $productImage->delete();
            $product->images()->orderBy('sort_order')->orderBy('id')->get()
                ->each(function (ProductImage $image, int $index): void {
                    $image->update(['is_primary' => $index === 0, 'sort_order' => $index + 1]);
                });
        });

        Storage::disk('public')->delete($path);

        return ApiResponse::success((new ProductResource($product->fresh()->load(['category', 'primaryImage', 'images', 'variants.product', 'variants.size'])))->resolve(), 'Product image deleted');
    }

    /** Xóa sản phẩm; thông tin dòng đơn cũ vẫn được giữ dưới dạng snapshot. */
    public function destroyProduct(Product $product): JsonResponse
    {
        $imagePaths = $product->images()->pluck('image')->all();
        $product->delete();
        Storage::disk('public')->delete($imagePaths);

        return ApiResponse::success(null, 'Product deleted');
    }

    /** Trả danh sách combo cùng sản phẩm thành phần cho trang quản trị. */
    public function combos(): JsonResponse
    {
        $combos = Combo::query()->with(['products.primaryImage', 'products.variants.size'])->orderBy('id')->get();

        return ApiResponse::success(ComboResource::collection($combos)->resolve(), 'Admin combos retrieved');
    }

    /** Tạo combo và gắn ít nhất hai sản phẩm đang có trong danh mục. */
    public function storeCombo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'image' => ['required', 'string', 'max:2048'],
            'discount_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['required', 'boolean'],
            'product_ids' => ['required', 'array', 'min:2', 'max:10'],
            'product_ids.*' => ['required', 'integer', 'distinct', 'exists:products,id'],
        ]);
        $combo = DB::transaction(function () use ($validated): Combo {
            $combo = Combo::query()->create([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']).'-'.Str::lower(Str::random(6)),
                'image' => $validated['image'],
                'discount_percent' => $validated['discount_percent'],
                'is_active' => $validated['is_active'],
            ]);
            $combo->products()->sync(collect($validated['product_ids'])->values()->mapWithKeys(fn ($id, $index) => [$id => ['sort_order' => $index + 1]])->all());

            return $combo;
        });

        return ApiResponse::success((new ComboResource($combo->load(['products.primaryImage', 'products.variants.size'])))->resolve(), 'Combo created', 201);
    }

    /** Cập nhật thông tin và danh sách sản phẩm thành phần của combo. */
    public function updateCombo(Request $request, Combo $combo): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'image' => ['sometimes', 'string', 'max:2048'],
            'discount_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'product_ids' => ['sometimes', 'array', 'min:2', 'max:10'],
            'product_ids.*' => ['required', 'integer', 'distinct', 'exists:products,id'],
        ]);
        DB::transaction(function () use ($combo, $validated): void {
            $combo->update(collect($validated)->except('product_ids')->all());
            if (array_key_exists('product_ids', $validated)) {
                $combo->products()->sync(collect($validated['product_ids'])->values()->mapWithKeys(fn ($id, $index) => [$id => ['sort_order' => $index + 1]])->all());
            }
        });

        return ApiResponse::success((new ComboResource($combo->fresh()->load(['products.primaryImage', 'products.variants.size'])))->resolve(), 'Combo updated');
    }

    /** Xóa combo nhưng giữ nguyên các sản phẩm thành phần. */
    public function destroyCombo(Combo $combo): JsonResponse
    {
        $combo->delete();

        return ApiResponse::success(null, 'Combo deleted');
    }

    /** Cập nhật tồn kho một biến thể, giữ nguyên SKU và size đã được chuẩn hóa. */
    public function updateVariant(Request $request, ProductVariant $variant): JsonResponse
    {
        $validated = $request->validate([
            'stock_quantity' => ['required', 'integer', 'min:0', 'max:1000000'],
        ]);
        $variant->update($validated);

        return ApiResponse::success([
            'id' => $variant->id,
            'stock_quantity' => $variant->stock_quantity,
            'in_stock' => $variant->stock_quantity > 0,
        ], 'Variant stock updated');
    }

    /**
     * Kiểm tra trạng thái được phép rồi cập nhật đơn hàng.
     */
    public function updateOrderStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'required', 'in:pending,confirmed,processing,shipping,completed,cancelled'],
            'payment_status' => ['sometimes', 'required', 'in:unpaid,paid,failed,refunded'],
        ]);

        abort_if($validated === [], 422, 'Không có trạng thái cần cập nhật.');

        $order->update($validated);

        return ApiResponse::success((new OrderResource($order->load(['items', 'requests'])))->resolve(), 'Order status updated');
    }

    /** Trả danh sách khách hàng cùng số đơn và tổng giá trị mua hàng. */
    public function customers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $customers = User::query()->where('role', User::ROLE_CUSTOMER)
            ->when($validated['search'] ?? null, fn ($query, string $search) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            }))
            ->withCount('orders')->withSum(['orders as completed_spend' => fn ($query) => $query->where('status', Order::STATUS_COMPLETED)], 'total')
            ->latest()->paginate($validated['per_page'] ?? 20)->withQueryString();
        $payload = UserResource::collection($customers)->response()->getData(true);

        return ApiResponse::success($payload, 'Admin customers retrieved');
    }

    /** Trả danh sách đánh giá đã đăng để quản trị viên theo dõi và xóa khi cần. */
    public function reviews(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $reviews = Review::query()->with(['user', 'product', 'order'])
            ->latest()->paginate($validated['per_page'] ?? 20)->withQueryString();

        return ApiResponse::success(ReviewResource::collection($reviews)->response()->getData(true), 'Admin reviews retrieved');
    }

    /** Xóa đánh giá không còn phù hợp khỏi hệ thống. */
    public function destroyReview(Review $review): JsonResponse
    {
        $review->delete();

        return ApiResponse::success(null, 'Review deleted');
    }

    /** Trả danh sách yêu cầu hoàn tiền và đổi trả để admin xử lý. */
    public function orderRequests(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected'],
            'type' => ['nullable', 'in:refund,return'],
        ]);
        $items = OrderRequest::query()->with(['order.items', 'user'])
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($validated['type'] ?? null, fn ($query, string $type) => $query->where('type', $type))
            ->latest()->paginate(50);

        return ApiResponse::success($items, 'Order requests retrieved');
    }

    /** Duyệt hoặc từ chối yêu cầu; yêu cầu hoàn tiền được duyệt sẽ cập nhật thanh toán. */
    public function updateOrderRequest(Request $request, OrderRequest $orderRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);
        abort_unless($orderRequest->status === OrderRequest::STATUS_PENDING, 422, 'Yêu cầu này đã được xử lý.');

        DB::transaction(function () use ($orderRequest, $validated) {
            $orderRequest->update([...$validated, 'resolved_at' => now()]);
            if ($validated['status'] === OrderRequest::STATUS_APPROVED && $orderRequest->type === OrderRequest::TYPE_REFUND) {
                $orderRequest->order()->update(['payment_status' => Order::PAYMENT_REFUNDED]);
            }
        });

        return ApiResponse::success($orderRequest->fresh()->load(['order.items', 'user']), 'Order request updated');
    }
}
