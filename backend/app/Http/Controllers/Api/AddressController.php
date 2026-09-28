<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    /**
     * Trả danh sách địa chỉ thuộc tài khoản đang đăng nhập.
     */
    public function index(Request $request): JsonResponse
    {
        return ApiResponse::success(AddressResource::collection($request->user()->addresses()->orderByDesc('is_default')->latest()->get())->resolve(), 'Addresses retrieved');
    }

    /**
     * Tạo địa chỉ của người dùng và chọn làm mặc định khi phù hợp.
     */
    public function store(Request $request): JsonResponse
    {
        $address = $request->user()->addresses()->create($this->validated($request));
        $this->makeDefaultIfNeeded($address);

        return ApiResponse::success((new AddressResource($address->fresh()))->resolve(), 'Address created', 201);
    }

    /**
     * Kiểm tra quyền sở hữu rồi cập nhật địa chỉ và cờ mặc định.
     */
    public function update(Request $request, Address $address): JsonResponse
    {
        $this->ownedBy($request, $address);
        $address->update($this->validated($request));
        $this->makeDefaultIfNeeded($address);
        $this->ensureDefaultExists($address->user_id);

        return ApiResponse::success((new AddressResource($address->fresh()))->resolve(), 'Address updated');
    }

    /**
     * Kiểm tra quyền sở hữu trước khi xóa địa chỉ.
     */
    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->ownedBy($request, $address);
        $userId = $address->user_id;
        $address->delete();
        $this->ensureDefaultExists($userId);

        return ApiResponse::success(null, 'Address deleted');
    }

    /**
     * Kiểm tra và trả các trường địa chỉ được phép lưu.
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'receiver_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'province' => ['required', 'string', 'max:100'],
            'district' => ['required', 'string', 'max:100'],
            'ward' => ['required', 'string', 'max:100'],
            'address_detail' => ['required', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
        ]);
    }

    /**
     * Đặt địa chỉ đầu tiên hoặc địa chỉ được chọn làm mặc định, bỏ cờ ở các địa chỉ còn lại.
     */
    private function makeDefaultIfNeeded(Address $address): void
    {
        $addresses = Address::query()->where('user_id', $address->user_id);

        if ($address->is_default || (clone $addresses)->count() === 1) {
            $addresses->whereKeyNot($address->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        }
    }

    /** Chọn một địa chỉ còn lại làm mặc định nếu tài khoản chưa có địa chỉ mặc định. */
    private function ensureDefaultExists(int $userId): void
    {
        $addresses = Address::query()->where('user_id', $userId);
        if (! (clone $addresses)->where('is_default', true)->exists()) {
            (clone $addresses)->latest()->first()?->update(['is_default' => true]);
        }
    }

    /**
     * Trả lỗi 404 nếu địa chỉ không thuộc người dùng hiện tại.
     */
    private function ownedBy(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 404);
    }
}
