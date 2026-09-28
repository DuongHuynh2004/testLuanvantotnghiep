<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Services\CheckoutService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /** Công khai các mã đang phát hành và điều kiện sử dụng, không lộ người đã dùng mã. */
    public function index(): JsonResponse
    {
        $coupons = Coupon::query()->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', now()))
            ->withCount('orders')->latest()->get()
            ->filter(fn (Coupon $coupon) => $coupon->usage_limit === null || $coupon->orders_count < $coupon->usage_limit)
            ->map(fn (Coupon $coupon) => $coupon->only(['code', 'name', 'discount_type', 'discount_value', 'minimum_order', 'maximum_discount', 'ends_at', 'per_user_limit']))->values();

        return ApiResponse::success($coupons, 'Available coupons');
    }

    /** Báo giá giỏ hoặc mua ngay, kiểm tra mã; chưa trừ tồn kho hay ghi nhận lượt sử dụng. */
    public function quote(Request $request, CheckoutService $checkout): JsonResponse
    {
        $validated = $request->validate([
            'coupon_code' => ['nullable', 'string', 'max:40'],
            'items' => ['sometimes', 'array', 'min:1', 'max:100'],
            'items.*.variant_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        return ApiResponse::success($checkout->toResponse($checkout->quote($request->user(), $validated['items'] ?? null, $validated['coupon_code'] ?? null)), 'Checkout quote');
    }
}
