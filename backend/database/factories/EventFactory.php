<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    public function definition(): array
    {
        $date = fake()->dateTimeBetween('-30 days', '+30 days');

        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'date' => $date->format('Y-m-d'),
            'start_time' => fake()->time('H:i', '18:00'),
            'end_time' => fake()->time('H:i', '21:00'),
            'venue' => fake()->randomElement([
                'Main Auditorium', 'Room 101', 'Student Center',
                'Gymnasium', 'Library Hall', 'Conference Room A',
                'Open Court', 'Engineering Building', 'Science Hall',
            ]),
            'capacity' => fake()->randomElement([50, 100, 150, 200, 300, 500]),
            'attendance_method' => fake()->randomElement(['facial', 'rfid', 'manual', 'any']),
            'status' => fake()->randomElement(['draft', 'upcoming', 'ongoing', 'completed']),
            'organizer_id' => User::factory()->organizer(),
        ];
    }

    public function upcoming(): static
    {
        return $this->state(fn () => [
            'date' => fake()->dateTimeBetween('+1 day', '+14 days')->format('Y-m-d'),
            'status' => 'upcoming',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'date' => fake()->dateTimeBetween('-30 days', '-1 day')->format('Y-m-d'),
            'status' => 'completed',
        ]);
    }

    public function ongoing(): static
    {
        return $this->state(fn () => [
            'date' => now()->format('Y-m-d'),
            'status' => 'ongoing',
        ]);
    }
}
