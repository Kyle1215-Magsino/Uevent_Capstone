<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FacialEnrollment>
 */
class FacialEnrollmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->student(),
            'status' => fake()->randomElement(['pending', 'approved']),
            'images_count' => fake()->numberBetween(3, 8),
            'face_data' => null,
            'submitted_at' => fake()->dateTimeBetween('-14 days', 'now'),
            'reviewed_at' => null,
            'reviewed_by' => null,
            'rejection_reason' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => 'approved',
            'reviewed_at' => now(),
            'face_data' => self::generateFakeDescriptors(fake()->numberBetween(3, 8)),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
        ]);
    }

    /**
     * Generate fake 128-dimensional face descriptors (mimics face-api.js output).
     */
    private static function generateFakeDescriptors(int $count = 5): string
    {
        $descriptors = [];
        // Create a base "identity" vector so all samples for one person are similar
        $base = array_map(fn () => fake()->randomFloat(6, -0.3, 0.3), range(1, 128));

        for ($i = 0; $i < $count; $i++) {
            // Add small noise to the base to simulate multiple captures of the same face
            $descriptor = array_map(
                fn ($v) => round($v + fake()->randomFloat(6, -0.02, 0.02), 6),
                $base
            );
            $descriptors[] = $descriptor;
        }

        return json_encode($descriptors);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
            'reviewed_at' => now(),
            'rejection_reason' => fake()->sentence(),
        ]);
    }
}
