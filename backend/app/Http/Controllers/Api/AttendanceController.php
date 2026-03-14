<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * Get attendance records for an event.
     */
    public function byEvent(Request $request, Event $event): JsonResponse
    {
        $query = $event->attendances()->with('user:id,name,email,student_id,role');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        $attendance = $query->orderBy('check_in_time', 'desc')
                            ->paginate($request->integer('per_page', 50));

        return response()->json($attendance);
    }

    /**
     * Get attendance for a student.
     */
    public function byStudent(Request $request, int $studentId): JsonResponse
    {
        $attendance = Attendance::with('event:id,title,date,venue,start_time,end_time')
            ->where('user_id', $studentId)
            ->orderBy('check_in_time', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($attendance);
    }

    /**
     * Get my attendance (for authenticated student).
     */
    public function myAttendance(Request $request): JsonResponse
    {
        $attendance = Attendance::with('event:id,title,date,venue,start_time,end_time')
            ->where('user_id', $request->user()->id)
            ->orderBy('check_in_time', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($attendance);
    }

    /**
     * Manual check-in.
     */
    public function manualCheckIn(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        return $this->recordAttendance($event, $validated['user_id'], 'manual');
    }

    /**
     * Generic check-in (student self-check-in or general).
     */
    public function checkIn(Request $request, Event $event): JsonResponse
    {
        $userId = $request->input('user_id', $request->user()->id);

        return $this->recordAttendance($event, $userId, 'manual');
    }

    /**
     * RFID-based check-in.
     */
    public function rfidCheckIn(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'string'],
        ]);

        $user = \App\Models\User::where('student_id', $validated['student_id'])->first();

        if (! $user) {
            return response()->json(['message' => 'Student not found with the given ID.'], 404);
        }

        return $this->recordAttendance($event, $user->id, 'rfid');
    }

    /**
     * Facial recognition check-in.
     */
    public function faceCheckIn(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        // In a real implementation, this would verify the face data
        // against the facial enrollment before recording attendance.
        return $this->recordAttendance($event, $validated['user_id'], 'facial');
    }

    /**
     * Live dashboard data for an event.
     */
    public function liveDashboard(Event $event): JsonResponse
    {
        $event->loadCount([
            'attendances as present_count' => fn ($q) => $q->where('status', 'present'),
            'attendances as late_count' => fn ($q) => $q->where('status', 'late'),
            'attendances as absent_count' => fn ($q) => $q->where('status', 'absent'),
            'attendances as total_attendees',
        ]);

        $recentCheckins = $event->attendances()
            ->with('user:id,name,email,student_id')
            ->orderBy('check_in_time', 'desc')
            ->limit(20)
            ->get();

        $methodBreakdown = $event->attendances()
            ->selectRaw('method, COUNT(*) as count')
            ->groupBy('method')
            ->pluck('count', 'method');

        return response()->json([
            'event' => $event,
            'recent_checkins' => $recentCheckins,
            'method_breakdown' => $methodBreakdown,
            'capacity_percentage' => $event->capacity
                ? round(($event->total_attendees / $event->capacity) * 100, 1)
                : null,
        ]);
    }

    /**
     * Record an attendance entry.
     */
    private function recordAttendance(Event $event, int $userId, string $method): JsonResponse
    {
        // Check duplicate
        $existing = Attendance::where('event_id', $event->id)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Attendance already recorded.',
                'attendance' => $existing->load('user:id,name,email,student_id'),
            ], 409);
        }

        // Determine if late
        $now = now();
        $eventStart = $event->date->copy()->setTimeFromTimeString($event->start_time);
        $status = $now->gt($eventStart->addMinutes(15)) ? 'late' : 'present';

        $attendance = Attendance::create([
            'event_id' => $event->id,
            'user_id' => $userId,
            'check_in_time' => $now,
            'method' => $method,
            'status' => $status,
        ]);

        $attendance->load('user:id,name,email,student_id');

        // Notify the student about successful check-in
        Notification::send(
            $userId,
            'check_in',
            'Check-in Confirmed',
            'You have been checked in to "' . $event->title . '" as ' . $status . '.',
            ['event_id' => $event->id, 'attendance_id' => $attendance->id]
        );

        return response()->json($attendance, 201);
    }
}
