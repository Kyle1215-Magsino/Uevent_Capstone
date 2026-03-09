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
            'title' => fake()->randomElement([
                'College Assembly: Academic Updates',
                'NSTP Community Immersion',
                'Student Org Fair & Recruitment',
                'IT Literacy Seminar',
                'Leadership Training for Student Leaders',
                'Anti-Drug Abuse Awareness Seminar',
                'Gender Sensitivity Orientation',
                'Library Orientation for Freshmen',
                'Career Guidance & Job Placement Talk',
                'First Aid & Emergency Response Training',
                'Research Ethics Orientation',
                'Culminating Activity: MAPEH Festival',
                'Parent-Teacher Conference',
                'Environmental Awareness Symposium',
                'University Founding Anniversary Program',
            ]),
            'description' => fake()->randomElement([
                'An informative event organized for the university community. All students are encouraged to attend.',
                'Part of the university calendar of activities for the current academic year.',
                'Mandatory attendance for all registered students of the participating colleges.',
                'An initiative by the Office of Student Affairs in collaboration with partner organizations.',
                'Educational event designed to enhance student learning and engagement beyond the classroom.',
            ]),
            'date' => $date->format('Y-m-d'),
            'start_time' => fake()->randomElement(['07:00', '07:30', '08:00', '09:00', '13:00', '14:00']),
            'end_time' => fake()->randomElement(['11:00', '12:00', '15:00', '16:00', '17:00']),
            'venue' => fake()->randomElement([
                'Main Auditorium',
                'AVR Building C',
                'Covered Court',
                'Engineering Building Room 301',
                'CIT Lobby & Function Hall',
                'University Oval',
                'Humanities Building Room 205',
                'Computer Laboratory 1-3',
                'Science Building Lecture Hall',
            ]),
            'capacity' => fake()->randomElement([80, 100, 150, 200, 300, 500, 800]),
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
