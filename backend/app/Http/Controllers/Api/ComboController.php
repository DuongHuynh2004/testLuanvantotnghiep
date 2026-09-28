<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComboResource;
use App\Models\Combo;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ComboController extends Controller
{
    /** Trả các combo đang bán cùng size còn hàng và giá giảm được tính từ server. */
    public function index(): JsonResponse
    {
        $combos = Combo::query()
            ->where('is_active', true)
            ->whereHas('products', fn ($query) => $query->where('status', Product::STATUS_ACTIVE))
            ->with([
                'products' => fn ($query) => $query->where('status', Product::STATUS_ACTIVE),
                'products.primaryImage',
                'products.variants.size',
            ])
            ->orderBy('id')
            ->get();

        return ApiResponse::success(ComboResource::collection($combos)->resolve(), 'Combos retrieved');
    }
}
