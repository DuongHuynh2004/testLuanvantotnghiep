<?php

namespace App\Services;

use App\Models\Combo;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ComboPricingService
{
    /**
     * Xác thực từng nhóm combo và tính tổng giảm giá từ giá bán hiện tại của các món.
     *
     * @param  Collection<int, array{combo_id: int|null, combo_group: string|null, product_id: int, quantity: int, subtotal: float}>  $lines
     */
    public function discount(Collection $lines, bool $strict = true): float
    {
        $groups = $lines->filter(fn (array $line): bool => filled($line['combo_group']))->groupBy('combo_group');
        if ($groups->isEmpty()) {
            return 0;
        }

        $combos = Combo::query()
            ->whereIn('id', $groups->flatten(1)->pluck('combo_id')->filter()->unique())
            ->with('products:id')
            ->get()
            ->keyBy('id');
        $discount = 0;

        foreach ($groups as $group) {
            $comboIds = $group->pluck('combo_id')->filter()->unique();
            $combo = $comboIds->count() === 1 ? $combos->get($comboIds->first()) : null;
            $actualProducts = $group->pluck('product_id')->sort()->values()->all();
            $expectedProducts = $combo?->products->pluck('id')->sort()->values()->all() ?? [];
            $isValid = $combo?->is_active
                && $actualProducts === $expectedProducts
                && count($actualProducts) === count(array_unique($actualProducts))
                && $group->pluck('quantity')->unique()->count() === 1;

            if (! $isValid) {
                if ($strict) {
                    throw ValidationException::withMessages(['combo' => 'Combo trong giỏ hàng không còn hợp lệ.']);
                }

                continue;
            }

            $discount += $group->sum('subtotal') * (float) $combo->discount_percent / 100;
        }

        return round($discount, 2);
    }
}
