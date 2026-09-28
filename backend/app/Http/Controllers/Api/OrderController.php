<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderRequest;
use App\Services\CheckoutService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /** Trả lịch sử đơn hàng phân trang của tài khoản đang đăng nhập. */
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()->with(['items.variant.product.primaryImage', 'requests', 'reviews'])->latest()->paginate(10);

        return ApiResponse::success(OrderResource::collection($orders)->response()->getData(true), 'Orders retrieved');
    }

    /** Chỉ trả chi tiết đơn hàng thuộc tài khoản hiện tại. */
    public function show(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        return ApiResponse::success((new OrderResource($order->load(['items.variant.product.primaryImage', 'requests', 'reviews'])))->resolve(), 'Order retrieved');
    }

    /** Khóa mã và tồn kho, định giá lại rồi lưu đơn cùng mã/giá tại thời điểm mua trong một transaction. */
    public function store(Request $request, CheckoutService $checkout): JsonResponse
    {
        $validated = $request->validate([
            'shipping_name' => ['required', 'string', 'max:255'],
            'shipping_phone' => ['required', 'string', 'max:20'],
            'shipping_address' => ['required', 'string', 'max:255'],
            'payment_method' => ['required', 'in:cod,bank_transfer'],
            'note' => ['nullable', 'string', 'max:1000'],
            'coupon_code' => ['nullable', 'string', 'max:40'],
            'items' => ['sometimes', 'array', 'min:1', 'max:100'],
            'items.*.variant_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);
        $order = DB::transaction(function () use ($request, $validated, $checkout): Order {
            $quote = $checkout->quote($request->user(), $validated['items'] ?? null, $validated['coupon_code'] ?? null, true);
            $order = $request->user()->orders()->create([
                ...collect($validated)->except(['items', 'coupon_code'])->all(),
                'order_code' => 'SNE-'.strtoupper(Str::random(10)),
                'subtotal' => $quote['subtotal'], 'shipping_fee' => $quote['shipping_fee'],
                'discount' => $quote['discount'], 'total' => $quote['total'],
                'coupon_id' => $quote['coupon']?->id, 'coupon_code' => $quote['coupon']?->code,
                'status' => Order::STATUS_PENDING, 'payment_status' => Order::PAYMENT_UNPAID,
            ]);
            foreach ($quote['items'] as $item) {
                $variant = $item['variant'];
                $order->items()->create([
                    'product_variant_id' => $variant->id, 'product_name' => $variant->product->name,
                    'variant_name' => $variant->displayName(), 'price' => $item['price'],
                    'combo_name' => $item['combo_name'], 'combo_group' => $item['combo_group'],
                    'quantity' => $item['quantity'], 'subtotal' => $item['subtotal'],
                ]);
                $variant->decrement('stock_quantity', $item['quantity']);
            }
            if ($quote['cart']) {
                $quote['cart']->items()->delete();
            }

            return $order;
        }, 3);

        return ApiResponse::success((new OrderResource($order->load(['items.variant.product.primaryImage', 'reviews'])))->resolve(), 'Order created', 201);
    }

    /** Hủy đơn chưa thanh toán trước khi xử lý và hoàn lại tồn kho đã giữ. */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        $order = DB::transaction(function () use ($order): Order {
            $lockedOrder = Order::query()->with('items.variant')->lockForUpdate()->findOrFail($order->id);
            abort_unless(in_array($lockedOrder->status, [Order::STATUS_PENDING, Order::STATUS_CONFIRMED], true), 422, 'Đơn hàng không còn có thể hủy.');
            abort_unless($lockedOrder->payment_status === Order::PAYMENT_UNPAID, 422, 'Đơn đã thanh toán cần gửi yêu cầu hoàn tiền.');

            foreach ($lockedOrder->items as $item) {
                $item->variant?->increment('stock_quantity', $item->quantity);
            }
            $lockedOrder->update(['status' => Order::STATUS_CANCELLED]);

            return $lockedOrder;
        }, 3);

        return ApiResponse::success((new OrderResource($order->load(['items.variant.product.primaryImage', 'requests', 'reviews'])))->resolve(), 'Order cancelled');
    }

    /** Gửi một yêu cầu hoàn tiền hoặc đổi trả cho đơn thuộc tài khoản hiện tại. */
    public function storeRequest(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);
        $validated = $request->validate([
            'type' => ['required', Rule::in([OrderRequest::TYPE_REFUND, OrderRequest::TYPE_RETURN]), Rule::unique('order_requests')->where('order_id', $order->id)],
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        if ($validated['type'] === OrderRequest::TYPE_REFUND) {
            abort_unless($order->payment_status === Order::PAYMENT_PAID && $order->status !== Order::STATUS_CANCELLED, 422, 'Chỉ đơn đã thanh toán mới có thể yêu cầu hoàn tiền.');
        } else {
            abort_unless($order->status === Order::STATUS_COMPLETED, 422, 'Chỉ đơn đã hoàn tất mới có thể yêu cầu đổi trả.');
        }

        $orderRequest = $order->requests()->create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => OrderRequest::STATUS_PENDING,
        ]);

        return ApiResponse::success($orderRequest, 'Order request created', 201);
    }
}
