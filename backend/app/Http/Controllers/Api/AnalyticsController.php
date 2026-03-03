<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\FacialEnrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Admin dashboard analytics.
     */
    public function dashboard(): JsonResponse
    {
        $totalUsers = User::count();
        $totalStudents = User::where('role', 'student')->count();
        $totalOrganizers = User::where('role', 'organizer')->count();
        $totalEvents = Event::count();
        $activeEvents = Event::whereIn('status', ['upcoming', 'ongoing'])->count();
        $completedEvents = Event::where('status', 'completed')->count();
        $totalAttendance = Attendance::whereIn('status', ['present', 'late'])->count();
        $pendingEnrollments = FacialEnrollment::where('status', 'pending')->count();

        // Attendance trend (last 30 days)
        $attendanceTrend = Attendance::where('check_in_time', '>=', now()->subDays(30))
            ->selectRaw('DATE(check_in_time) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Events by status
        $eventsByStatus = Event::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Recent events
        $recentEvents = Event::with('organizer:id,name')
            ->withCount('attendances')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'total_users' => $totalUsers,
            'total_students' => $totalStudents,
            'total_organizers' => $totalOrganizers,
            'total_events' => $totalEvents,
            'active_events' => $activeEvents,
            'completed_events' => $completedEvents,
            'total_attendance' => $totalAttendance,
            'pending_enrollments' => $pendingEnrollments,
            'attendance_trend' => $attendanceTrend,
            'events_by_status' => $eventsByStatus,
            'recent_events' => $recentEvents,
        ]);
    }

    /**
     * Event-level statistics.
     */
    public function eventStats(Request $request): JsonResponse
    {
        $query = Event::withCount([
            'attendances as present_count' => fn ($q) => $q->where('status', 'present'),
            'attendances as late_count' => fn ($q) => $q->where('status', 'late'),
            'attendances as absent_count' => fn ($q) => $q->where('status', 'absent'),
            'attendances as total_attendees',
        ]);

        if ($request->filled('from')) {
            $query->where('date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('date', '<=', $request->to);
        }

        $events = $query->orderBy('date', 'desc')
                        ->paginate($request->integer('per_page', 15));

        return response()->json($events);
    }

    /**
     * Attendance-level statistics.
     */
    public function attendanceStats(Request $request): JsonResponse
    {
        // Overall method breakdown
        $byMethod = Attendance::selectRaw('method, COUNT(*) as count')
            ->groupBy('method')
            ->pluck('count', 'method');

        // Overall status breakdown
        $byStatus = Attendance::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Top attending students
        $topStudents = User::where('role', 'student')
            ->withCount(['attendances' => fn ($q) => $q->whereIn('status', ['present', 'late'])])
            ->orderByDesc('attendances_count')
            ->limit(10)
            ->get(['id', 'name', 'email', 'student_id']);

        // Attendance rate per event
        $attendanceRates = Event::where('capacity', '>', 0)
            ->withCount('attendances')
            ->get()
            ->map(fn ($e) => [
                'event' => $e->title,
                'rate' => round(($e->attendances_count / $e->capacity) * 100, 1),
            ]);

        return response()->json([
            'by_method' => $byMethod,
            'by_status' => $byStatus,
            'top_students' => $topStudents,
            'attendance_rates' => $attendanceRates,
        ]);
    }
}
