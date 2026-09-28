<?php

namespace Database\Factories;

use App\Models\Combo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Combo>
 */
class ComboFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'image' => 'combos/combo-test.png',
            'discount_percent' => 5,
            'is_active' => true,
        ];
    }
}
