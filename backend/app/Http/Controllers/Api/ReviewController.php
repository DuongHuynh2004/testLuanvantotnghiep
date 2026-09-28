<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /** Trả các đánh giá đã đăng của sản phẩm, kèm thông tin người viết. */
    public function index(Product $product): JsonResponse
    {
        $reviews = $product->reviews()->where('status', Review::STATUS_APPROVED)->with('user')->latest()->get();

        return ApiResponse::success(ReviewResource::collection($reviews)->resolve(), 'Reviews retrieved');
    }

    /** Đăng ngay đánh giá khi khách đã mua sản phẩm trong một đơn hoàn tất. */
    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $order = $request->user()->orders()
            ->whereKey($validated['order_id'])
            ->where('status', Order::STATUS_COMPLETED)
            ->whereHas('items.variant', fn ($query) => $query->where('product_id', $product->id))
            ->first();

        abort_unless($order, 422, 'Bạn chỉ có thể đánh giá sản phẩm từ đơn đã hoàn tất.');
        abort_if(Review::query()->where('user_id', $request->user()->id)->where('product_id', $product->id)->where('order_id', $order->id)->exists(), 422, 'Bạn đã đánh giá sản phẩm này trong đơn hàng.');

        $review = $product->reviews()->create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => Review::STATUS_APPROVED,
        ]);

        return ApiResponse::success((new ReviewResource($review->load('user')))->resolve(), 'Review published', 201);
    }

    /** Cho phép khách sửa số sao và nội dung trong đánh giá của chính mình. */
    public function update(Request $request, Review $review): JsonResponse
    {
        abort_unless($review->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $review->update([...$validated, 'status' => Review::STATUS_APPROVED]);

        return ApiResponse::success((new ReviewResource($review->load('user')))->resolve(), 'Review updated');
    }

    /** Cho phép khách xóa đánh giá của chính mình. */
    public function destroy(Request $request, Review $review): JsonResponse
    {
        abort_unless($review->user_id === $request->user()->id, 404);
        $review->delete();

        return ApiResponse::success(null, 'Review deleted');
    }
}
