<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attendance>
 */
class AttendanceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'user_id' => User::factory()->student(),
            'check_in_time' => fake()->dateTimeBetween('-30 days', 'now'),
            'method' => fake()->randomElement(['facial', 'rfid', 'manual']),
            'status' => fake()->randomElement(['present', 'late']),
        ];
    }
}
