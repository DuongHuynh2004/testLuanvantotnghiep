<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PromotionController extends Controller
{
    /** Danh sách cấu hình ưu đãi sản phẩm và mã, gồm cả mục chưa đến hạn hoặc đã tắt. */
    public function index(): JsonResponse
    {
        return ApiResponse::success([
            'products' => Product::query()->orderBy('name')->get(['id', 'name', 'base_price', 'sale_price', 'promotion_name', 'promotion_starts_at', 'promotion_ends_at']),
            'coupons' => Coupon::query()->withCount('orders')->latest()->get(),
        ]);
    }

    /** Gắn hoặc gỡ ưu đãi sản phẩm. Giá biến thể kế thừa sẽ tự cập nhật theo sản phẩm. */
    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'sale_price' => ['present', 'nullable', 'numeric', 'min:0', 'max:'.max(0, (float) $product->base_price - 0.01)],
            'promotion_name' => ['nullable', 'string', 'max:120'],
            'promotion_starts_at' => ['nullable', 'date'],
            'promotion_ends_at' => ['nullable', 'date', ...($request->filled('promotion_starts_at') ? ['after:promotion_starts_at'] : [])],
        ]);
        if ($data['sale_price'] === null) {
            $data = ['sale_price' => null, 'promotion_name' => null, 'promotion_starts_at' => null, 'promotion_ends_at' => null];
        } else {
            $data['promotion_name'] = $data['promotion_name'] ?? 'Ưu đãi sản phẩm';
        }
        $product->update($data);

        return ApiResponse::success($product->only(['id', 'name', 'base_price', 'sale_price', 'promotion_name', 'promotion_starts_at', 'promotion_ends_at']));
    }

    /** Phát hành mã mới với điều kiện giá trị, thời gian và giới hạn sử dụng. */
    public function store(Request $request): JsonResponse
    {
        $coupon = Coupon::query()->create($this->validated($request));

        return ApiResponse::success($coupon->loadCount('orders'), 'Coupon created', 201);
    }

    /** Cập nhật hoặc tắt mã, giữ ID để lịch sử lượt dùng và đơn hàng không bị mất. */
    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $coupon->update($this->validated($request, $coupon));

        return ApiResponse::success($coupon->loadCount('orders'));
    }

    /** Xóa mã chưa từng dùng; mã có lịch sử đơn hàng cần được tắt để giữ dữ liệu đối soát. */
    public function destroy(Coupon $coupon): JsonResponse
    {
        if ($coupon->orders()->exists()) {
            return ApiResponse::error('Mã đã được sử dụng. Hãy tắt mã để giữ lịch sử đơn hàng.', 422);
        }

        $coupon->delete();

        return ApiResponse::success(null, 'Coupon deleted');
    }

    /** Chuẩn hóa mã viết hoa và kiểm tra toàn bộ cấu hình trước khi lưu. */
    private function validated(Request $request, ?Coupon $coupon = null): array
    {
        $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);

        return $request->validate([
            'code' => ['required', 'string', 'max:40', 'regex:/^[A-Z0-9_-]+$/', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'name' => ['required', 'string', 'max:120'],
            'discount_type' => ['required', 'in:percent,fixed'],
            'discount_value' => ['required', 'numeric', 'min:0.01', $request->input('discount_type') === 'percent' ? 'max:100' : 'max:999999999'],
            'minimum_order' => ['required', 'numeric', 'min:0', 'max:999999999'],
            'maximum_discount' => ['nullable', 'numeric', 'min:0.01', 'max:999999999'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', ...($request->filled('starts_at') ? ['after:starts_at'] : [])],
            'usage_limit' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'per_user_limit' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
