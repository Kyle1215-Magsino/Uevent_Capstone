<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\FacialEnrollment;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ── Fixed test accounts (password: "password123") ──

        $admin = User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@ueventtrack.com',
        ]);

        $organizer1 = User::factory()->organizer()->create([
            'name' => 'Sarah Organizer',
            'email' => 'organizer@ueventtrack.com',
        ]);

        $organizer2 = User::factory()->organizer()->create([
            'name' => 'Mike Organizer',
            'email' => 'organizer2@ueventtrack.com',
        ]);

        $student1 = User::factory()->student()->create([
            'name' => 'John Student',
            'email' => 'student@ueventtrack.com',
            'student_id' => 'STU-00001',
        ]);

        // ── Additional students ──
        $students = User::factory()->student()->count(20)->create();
        $allStudents = $students->push($student1);

        // ── Additional organizers ──
        User::factory()->organizer()->count(3)->create();

        // ── Events ──
        $upcomingEvents = Event::factory()->upcoming()->count(5)->create([
            'organizer_id' => $organizer1->id,
        ]);

        $completedEvents = Event::factory()->completed()->count(8)->create([
            'organizer_id' => $organizer1->id,
        ]);

        $ongoingEvent = Event::factory()->ongoing()->create([
            'organizer_id' => $organizer1->id,
            'title' => 'USG General Assembly — Live',
            'venue' => 'Main Auditorium',
            'capacity' => 200,
        ]);

        Event::factory()->upcoming()->count(3)->create([
            'organizer_id' => $organizer2->id,
        ]);

        Event::factory()->completed()->count(4)->create([
            'organizer_id' => $organizer2->id,
        ]);

        // ── Attendance for completed events ──
        foreach ($completedEvents as $event) {
            $attendees = $allStudents->random(rand(8, 18));
            foreach ($attendees as $student) {
                Attendance::factory()->create([
                    'event_id' => $event->id,
                    'user_id' => $student->id,
                    'check_in_time' => $event->date->copy()->setTimeFromTimeString($event->start_time)->addMinutes(rand(0, 30)),
                ]);
            }
        }

        // ── Attendance for ongoing event ──
        $ongoingAttendees = $allStudents->random(12);
        foreach ($ongoingAttendees as $student) {
            Attendance::factory()->create([
                'event_id' => $ongoingEvent->id,
                'user_id' => $student->id,
                'check_in_time' => now()->subMinutes(rand(5, 60)),
            ]);
        }

        // ── Facial enrollments ──
        // Approved enrollments (with face_data) for some students
        foreach ($allStudents->take(10) as $student) {
            FacialEnrollment::factory()->approved()->create([
                'user_id' => $student->id,
                'reviewed_by' => $admin->id,
            ]);
        }

        // Pending enrollments (no face_data yet — awaiting admin review)
        foreach ($allStudents->slice(10, 10) as $student) {
            FacialEnrollment::factory()->pending()->create([
                'user_id' => $student->id,
                'reviewed_by' => rand(0, 1) ? $admin->id : null,
            ]);
        }
    }
}
