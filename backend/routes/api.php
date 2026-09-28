<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\Admin\AdminAccessController;
use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\PromotionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ComboController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::get('/categories', [CatalogController::class, 'categories']);
Route::get('/coupons', [CouponController::class, 'index']);
Route::get('/products', [CatalogController::class, 'products']);
Route::get('/products/{product:slug}', [CatalogController::class, 'show']);
Route::get('/products/{product:slug}/reviews', [ReviewController::class, 'index']);
Route::get('/combos', [ComboController::class, 'index']);

Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/checkout/quote', [CouponController::class, 'quote']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::patch('/user', [AuthController::class, 'updateProfile']);
    Route::patch('/user/password', [AuthController::class, 'changePassword']);
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::post('/cart/combos', [CartController::class, 'storeCombo']);
    Route::patch('/cart/items/{cartItem}', [CartController::class, 'update']);
    Route::patch('/cart/items/{cartItem}/variant', [CartController::class, 'updateVariant']);
    Route::delete('/cart/items/{cartItem}', [CartController::class, 'destroy']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::patch('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{order}/requests', [OrderController::class, 'storeRequest']);
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy']);
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::patch('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
    Route::post('/products/{product:slug}/reviews', [ReviewController::class, 'store']);
    Route::patch('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/promotions', [PromotionController::class, 'index']);
        Route::patch('/products/{product}/promotion', [PromotionController::class, 'updateProduct']);
        Route::post('/coupons', [PromotionController::class, 'store']);
        Route::put('/coupons/{coupon}', [PromotionController::class, 'update']);
        Route::delete('/coupons/{coupon}', [PromotionController::class, 'destroy']);
        Route::get('/access', AdminAccessController::class);
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::patch('/orders/{order}/status', [AdminController::class, 'updateOrderStatus']);
        Route::get('/order-requests', [AdminController::class, 'orderRequests']);
        Route::patch('/order-requests/{orderRequest}', [AdminController::class, 'updateOrderRequest']);
        Route::get('/products', [AdminController::class, 'products']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::patch('/products/{product}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{product}', [AdminController::class, 'destroyProduct']);
        Route::get('/combos', [AdminController::class, 'combos']);
        Route::post('/combos', [AdminController::class, 'storeCombo']);
        Route::patch('/combos/{combo}', [AdminController::class, 'updateCombo']);
        Route::delete('/combos/{combo}', [AdminController::class, 'destroyCombo']);
        Route::post('/products/{product}/images', [AdminController::class, 'replaceProductImages']);
        Route::delete('/products/{product}/images/{productImage}', [AdminController::class, 'destroyProductImage']);
        Route::patch('/variants/{variant}', [AdminController::class, 'updateVariant']);
        Route::get('/customers', [AdminController::class, 'customers']);
        Route::get('/reviews', [AdminController::class, 'reviews']);
        Route::delete('/reviews/{review}', [AdminController::class, 'destroyReview']);
    });
});
