<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\FacialEnrollment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ── Fixed test accounts (password: "password123") ────────────────

        $admin = User::factory()->admin()->create([
            'name'  => 'Dr. Renato C. Villarosa',
            'email' => 'admin@ueventtrack.com',
        ]);

        $organizer1 = User::factory()->organizer()->create([
            'name'  => 'Engr. Dalisay M. Reyes',
            'email' => 'organizer@ueventtrack.com',
        ]);

        $organizer2 = User::factory()->organizer()->create([
            'name'  => 'Prof. Rosario T. Bautista',
            'email' => 'organizer2@ueventtrack.com',
        ]);

        $student1 = User::factory()->student()->create([
            'name'       => 'Althea Mae D. Villanueva',
            'email'      => 'student@ueventtrack.com',
            'student_id' => '2023-01247',
        ]);

        // ── Named students ───────────────────────────────────────────────
        $namedStudents = collect([
            ['name' => 'Rafael Angelo P. Soriano',   'student_id' => '2022-00583'],
            ['name' => 'Jessa Marie L. Pangilinan',  'student_id' => '2024-01802'],
            ['name' => 'Mark Jayson R. Tolentino',   'student_id' => '2023-00916'],
            ['name' => 'Kyla Denise A. Aguilar',     'student_id' => '2024-02134'],
            ['name' => 'John Patrick B. Magbanua',   'student_id' => '2022-01053'],
            ['name' => 'Ma. Christina F. Navarro',   'student_id' => '2023-01578'],
            ['name' => 'Angelo Gabriel S. Dela Cruz','student_id' => '2024-00347'],
            ['name' => 'Princess Joy M. Ramos',      'student_id' => '2023-00891'],
            ['name' => 'Carl Justin T. Manalo',      'student_id' => '2022-01432'],
            ['name' => 'Francine Ella G. Santos',    'student_id' => '2024-01205'],
            ['name' => 'Zyrus Kiel V. Lim',         'student_id' => '2023-02004'],
            ['name' => 'Alyssa Nicole C. Torres',    'student_id' => '2024-00768'],
            ['name' => 'James Andrei R. Perez',      'student_id' => '2022-00921'],
            ['name' => 'Bea Katrine D. Mendoza',     'student_id' => '2023-01690'],
            ['name' => 'Renz Michael S. Garcia',     'student_id' => '2024-01456'],
            ['name' => 'Shaina Mae L. Aquino',       'student_id' => '2022-01198'],
            ['name' => 'Edzel Franz P. Dizon',       'student_id' => '2023-00432'],
            ['name' => 'Klarisse Ann J. Reyes',      'student_id' => '2024-01923'],
            ['name' => 'Ivan Josh M. Cruz',          'student_id' => '2023-01087'],
            ['name' => 'Trisha Mae B. Fernandez',    'student_id' => '2022-00654'],
        ])->map(fn ($s) => User::factory()->student()->create($s));

        $allStudents = $namedStudents->push($student1);

        // ── Named organizers ─────────────────────────────────────────────
        $organizer3 = User::factory()->organizer()->create([
            'name'  => 'Ms. Patricia Ann V. Lozano',
            'email' => 'plozano@university.edu.ph',
        ]);
        $organizer4 = User::factory()->organizer()->create([
            'name'  => 'Mr. Romulo G. Santiago',
            'email' => 'rsantiago@university.edu.ph',
        ]);
        $organizer5 = User::factory()->organizer()->create([
            'name'  => 'Engr. Francis Leo N. Mercado',
            'email' => 'fmercado@university.edu.ph',
        ]);

        // ── Events — specific, realistic titles ─────────────────────────

        // Completed events (organizer 1)
        $completedEventsData = [
            [
                'title'             => 'University Foundation Day & Homecoming',
                'description'       => 'Annual celebration of the university\'s founding. Features cultural presentations, alumni recognition, and a grand homecoming program.',
                'date'              => '2025-11-15',
                'start_time'        => '07:00',
                'end_time'          => '17:00',
                'venue'             => 'University Oval',
                'capacity'          => 1500,
                'attendance_method' => 'rfid',
            ],
            [
                'title'             => 'University Christmas Celebration 2025',
                'description'       => 'Year-end Christmas program with parlor games, exchange gifts, and performances from each college.',
                'date'              => '2025-12-17',
                'start_time'        => '17:00',
                'end_time'          => '21:00',
                'venue'             => 'Covered Court',
                'capacity'          => 800,
                'attendance_method' => 'manual',
            ],
            [
                'title'             => 'Mental Health Awareness Webinar',
                'description'       => 'Online forum on recognizing signs of stress, anxiety, and depression among students. With guest speaker from DOH.',
                'date'              => '2026-02-06',
                'start_time'        => '10:00',
                'end_time'          => '12:00',
                'venue'             => 'AVR Building C (Hybrid)',
                'capacity'          => 300,
                'attendance_method' => 'manual',
            ],
            [
                'title'             => 'CIT Industry Immersion Fair',
                'description'       => 'Partner companies present internship and OJT opportunities for IT, CS, and IS students.',
                'date'              => '2026-02-11',
                'start_time'        => '09:00',
                'end_time'          => '16:00',
                'venue'             => 'CIT Lobby & Function Hall',
                'capacity'          => 250,
                'attendance_method' => 'facial',
            ],
            [
                'title'             => 'SSG General Assembly: 2nd Semester',
                'description'       => 'Supreme Student Government general assembly covering org accreditation updates, budget allocation, and upcoming university-wide projects.',
                'date'              => '2026-02-18',
                'start_time'        => '14:00',
                'end_time'          => '17:00',
                'venue'             => 'Main Auditorium',
                'capacity'          => 1200,
                'attendance_method' => 'rfid',
            ],
            [
                'title'             => 'Research Colloquium: AI & Emerging Tech',
                'description'       => 'Faculty and senior students present research papers on artificial intelligence, IoT, and cybersecurity.',
                'date'              => '2026-02-25',
                'start_time'        => '09:00',
                'end_time'          => '15:00',
                'venue'             => 'Engineering Building Room 301',
                'capacity'          => 120,
                'attendance_method' => 'facial',
            ],
            [
                'title'             => 'Blood Donation Drive – Red Cross Partnership',
                'description'       => 'In partnership with Philippine Red Cross, open to all students and staff. Free health screening included.',
                'date'              => '2026-03-04',
                'start_time'        => '08:00',
                'end_time'          => '15:00',
                'venue'             => 'University Health Center',
                'capacity'          => 200,
                'attendance_method' => 'manual',
            ],
            [
                'title'             => 'Parangal: Academic Honors Convocation',
                'description'       => 'Recognition of Dean\'s List and University Scholar awardees for 1st Semester AY 2025-2026.',
                'date'              => '2026-03-07',
                'start_time'        => '14:00',
                'end_time'          => '17:00',
                'venue'             => 'Main Auditorium',
                'capacity'          => 250,
                'attendance_method' => 'rfid',
            ],
        ];

        $completedEvents = collect();
        foreach ($completedEventsData as $data) {
            $completedEvents->push(Event::create(array_merge($data, [
                'status'       => 'completed',
                'organizer_id' => $organizer1->id,
            ])));
        }

        // Ongoing event
        $ongoingEvent = Event::create([
            'title'             => 'CIT Week 2026: Opening Ceremony',
            'description'       => 'Official opening of CIT Week featuring a parade of colleges, Mr. & Ms. CIT pageant preliminaries, and tech quiz bowl eliminations.',
            'date'              => now()->format('Y-m-d'),
            'start_time'        => '08:00',
            'end_time'          => '17:00',
            'venue'             => 'CIT Covered Court',
            'capacity'          => 600,
            'attendance_method' => 'facial',
            'status'            => 'ongoing',
            'organizer_id'      => $organizer1->id,
        ]);

        // Upcoming events (organizer 1)
        $upcomingEventsData = [
            [
                'title'             => 'NSTP Civic Welfare Training – Batch 4',
                'description'       => 'Community outreach and cleanup drive at Brgy. San Isidro. Includes tree planting and feeding program.',
                'date'              => '2026-03-11',
                'start_time'        => '07:30',
                'end_time'          => '12:00',
                'venue'             => 'Brgy. San Isidro (Off-campus)',
                'capacity'          => 180,
                'attendance_method' => 'facial',
            ],
            [
                'title'             => 'GAD Sensitivity Forum',
                'description'       => 'Gender and development orientation session discussing gender equality, safe spaces, and anti-harassment policies.',
                'date'              => '2026-03-14',
                'start_time'        => '13:00',
                'end_time'          => '16:00',
                'venue'             => 'AVR Building C',
                'capacity'          => 300,
                'attendance_method' => 'facial',
            ],
            [
                'title'             => 'Intramurals 2026 – Opening Ceremony',
                'description'       => 'Opening salvo of the annual university intramurals with an oath of sportsmanship, parade of athletes, and exhibition games.',
                'date'              => '2026-03-18',
                'start_time'        => '07:00',
                'end_time'          => '17:00',
                'venue'             => 'University Oval',
                'capacity'          => 2000,
                'attendance_method' => 'rfid',
            ],
            [
                'title'             => 'CIT Week 2026: Tech Hackathon',
                'description'       => '24-hour coding competition where teams build solutions to real-world problems. Open to all CIT students.',
                'date'              => '2026-03-12',
                'start_time'        => '08:00',
                'end_time'          => '08:00',
                'venue'             => 'Computer Laboratory 1-3',
                'capacity'          => 100,
                'attendance_method' => 'facial',
            ],
            [
                'title'             => 'Fire & Earthquake Drill – 1st Sem',
                'description'       => 'University-wide emergency preparedness drill in coordination with BFP and local DRRMO.',
                'date'              => '2026-03-20',
                'start_time'        => '09:00',
                'end_time'          => '11:00',
                'venue'             => 'All University Buildings',
                'capacity'          => 3000,
                'attendance_method' => 'rfid',
            ],
        ];

        $upcomingEvents = collect();
        foreach ($upcomingEventsData as $data) {
            $upcomingEvents->push(Event::create(array_merge($data, [
                'status'       => 'upcoming',
                'organizer_id' => $organizer1->id,
            ])));
        }

        // Organizer 2 events
        Event::create([
            'title'             => 'Journalism Workshop: Campus Press Freedom',
            'description'       => 'Hands-on workshop for campus journalists covering ethics, sourcing, and digital publishing.',
            'date'              => '2026-03-15',
            'start_time'        => '09:00',
            'end_time'          => '16:00',
            'venue'             => 'Humanities Building Room 205',
            'capacity'          => 60,
            'attendance_method' => 'manual',
            'status'            => 'upcoming',
            'organizer_id'      => $organizer2->id,
        ]);

        Event::create([
            'title'             => 'Filipino Cultural Night: Sayaw at Awitin',
            'description'       => 'Cultural showcase of traditional Filipino dances, songs, and spoken word. Each college presents one performance.',
            'date'              => '2026-03-22',
            'start_time'        => '18:00',
            'end_time'          => '21:00',
            'venue'             => 'Main Auditorium',
            'capacity'          => 500,
            'attendance_method' => 'facial',
            'status'            => 'upcoming',
            'organizer_id'      => $organizer2->id,
        ]);

        Event::create([
            'title'             => 'Entrepreneurship Bootcamp: Startup 101',
            'description'       => 'Two-day intensive bootcamp on business model canvas, pitching, and securing funding. With DTI speakers.',
            'date'              => '2026-03-25',
            'start_time'        => '08:00',
            'end_time'          => '17:00',
            'venue'             => 'Business Administration Function Hall',
            'capacity'          => 80,
            'attendance_method' => 'rfid',
            'status'            => 'upcoming',
            'organizer_id'      => $organizer2->id,
        ]);

        // Completed events by organizer 2
        $org2Completed = [
            [
                'title'             => 'Freshmen Welcome Assembly 2025',
                'description'       => 'Orientation program for incoming freshmen. Introduction to university policies, student orgs, and campus tour.',
                'date'              => '2025-08-20',
                'start_time'        => '08:00',
                'end_time'          => '12:00',
                'venue'             => 'Main Auditorium',
                'capacity'          => 700,
                'attendance_method' => 'rfid',
            ],
            [
                'title'             => 'Anti-Bullying & Cyber Safety Seminar',
                'description'       => 'Awareness campaign on Republic Act 10627 (Anti-Bullying Act) and responsible social media usage.',
                'date'              => '2025-10-14',
                'start_time'        => '13:00',
                'end_time'          => '16:00',
                'venue'             => 'AVR Building C',
                'capacity'          => 200,
                'attendance_method' => 'manual',
            ],
            [
                'title'             => 'Inter-College Debate Tournament: Finals',
                'description'       => 'Championship round of the inter-college debate tournament. Topic: "AI Should Replace Traditional Examinations."',
                'date'              => '2025-11-28',
                'start_time'        => '14:00',
                'end_time'          => '17:00',
                'venue'             => 'Humanities Building Room 205',
                'capacity'          => 150,
                'attendance_method' => 'manual',
            ],
            [
                'title'             => 'Environmental Clean-Up: Adopt-A-River',
                'description'       => 'Community extension program for river clean-up in partnership with DENR. Includes eco-brick workshop.',
                'date'              => '2026-01-25',
                'start_time'        => '06:00',
                'end_time'          => '12:00',
                'venue'             => 'Brgy. Riverside (Off-campus)',
                'capacity'          => 200,
                'attendance_method' => 'manual',
            ],
        ];

        $org2CompletedEvents = collect();
        foreach ($org2Completed as $data) {
            $org2CompletedEvents->push(Event::create(array_merge($data, [
                'status'       => 'completed',
                'organizer_id' => $organizer2->id,
            ])));
        }

        // ── Attendance for completed events ──────────────────────────────
        $attendanceCounts = [14, 11, 8, 15, 18, 10, 13, 16]; // per organizer-1 completed event
        foreach ($completedEvents as $i => $event) {
            $count = $attendanceCounts[$i] ?? rand(10, 18);
            $attendees = $allStudents->random(min($count, $allStudents->count()));
            foreach ($attendees as $student) {
                Attendance::factory()->create([
                    'event_id'      => $event->id,
                    'user_id'       => $student->id,
                    'check_in_time' => Carbon::parse($event->date)->setTimeFromTimeString($event->start_time)->addMinutes(rand(-5, 25)),
                    'method'        => fake()->randomElement(['facial', 'rfid', 'manual']),
                    'status'        => fake()->randomElement(['present', 'present', 'present', 'late']),
                ]);
            }
        }

        // Attendance for org2 completed events
        foreach ($org2CompletedEvents as $event) {
            $attendees = $allStudents->random(rand(9, 16));
            foreach ($attendees as $student) {
                Attendance::factory()->create([
                    'event_id'      => $event->id,
                    'user_id'       => $student->id,
                    'check_in_time' => Carbon::parse($event->date)->setTimeFromTimeString($event->start_time)->addMinutes(rand(-3, 20)),
                    'method'        => fake()->randomElement(['facial', 'rfid', 'manual']),
                    'status'        => fake()->randomElement(['present', 'present', 'present', 'late']),
                ]);
            }
        }

        // ── Attendance for ongoing event ─────────────────────────────────
        $ongoingAttendees = $allStudents->random(14);
        foreach ($ongoingAttendees as $student) {
            Attendance::factory()->create([
                'event_id'      => $ongoingEvent->id,
                'user_id'       => $student->id,
                'check_in_time' => now()->subMinutes(rand(5, 90)),
                'method'        => fake()->randomElement(['facial', 'facial', 'rfid']),
                'status'        => 'present',
            ]);
        }

        // ── Facial enrollments ───────────────────────────────────────────
        // Approved (with face_data) — first 12 students
        foreach ($allStudents->take(12) as $student) {
            FacialEnrollment::factory()->approved()->create([
                'user_id'      => $student->id,
                'images_count' => rand(5, 8),
                'submitted_at' => now()->subDays(rand(10, 45)),
                'reviewed_at'  => now()->subDays(rand(1, 9)),
                'reviewed_by'  => $admin->id,
            ]);
        }

        // Pending (awaiting review) — next 5 students
        foreach ($allStudents->slice(12, 5) as $student) {
            FacialEnrollment::factory()->pending()->create([
                'user_id'      => $student->id,
                'images_count' => rand(4, 6),
                'submitted_at' => now()->subDays(rand(1, 7)),
            ]);
        }

        // Rejected — 2 students
        foreach ($allStudents->slice(17, 2) as $student) {
            FacialEnrollment::factory()->rejected()->create([
                'user_id'          => $student->id,
                'images_count'     => rand(2, 3),
                'submitted_at'     => now()->subDays(rand(8, 14)),
                'reviewed_at'      => now()->subDays(rand(1, 5)),
                'reviewed_by'      => $admin->id,
                'rejection_reason' => fake()->randomElement([
                    'Face not clearly visible in captured frames. Please re-enroll in a well-lit area.',
                    'Insufficient quality — multiple frames were blurry. Try removing eyeglasses and facing the camera directly.',
                    'Only partial face detected. Ensure your full face is within the camera frame during enrollment.',
                ]),
            ]);
        }
    }
}
