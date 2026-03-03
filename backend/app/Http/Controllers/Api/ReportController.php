<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Event report — full attendance breakdown for a single event.
     */
    public function eventReport(Event $event): JsonResponse
    {
        $event->load('organizer:id,name,email');
        $event->loadCount([
            'attendances as present_count' => fn ($q) => $q->where('status', 'present'),
            'attendances as late_count' => fn ($q) => $q->where('status', 'late'),
            'attendances as absent_count' => fn ($q) => $q->where('status', 'absent'),
            'attendances as total_attendees',
        ]);

        $attendees = $event->attendances()
            ->with('user:id,name,email,student_id')
            ->orderBy('check_in_time')
            ->get();

        $methodBreakdown = $event->attendances()
            ->selectRaw('method, COUNT(*) as count')
            ->groupBy('method')
            ->pluck('count', 'method');

        return response()->json([
            'event' => $event,
            'attendees' => $attendees,
            'method_breakdown' => $methodBreakdown,
        ]);
    }

    /**
     * Attendance report across events (filterable by date range).
     */
    public function attendanceReport(Request $request): JsonResponse
    {
        $query = Attendance::with([
            'user:id,name,email,student_id',
            'event:id,title,date,venue',
        ]);

        if ($request->filled('from')) {
            $query->whereHas('event', fn ($q) => $q->where('date', '>=', $request->from));
        }
        if ($request->filled('to')) {
            $query->whereHas('event', fn ($q) => $q->where('date', '<=', $request->to));
        }
        if ($request->filled('event_id')) {
            $query->where('event_id', $request->event_id);
        }

        $records = $query->orderBy('check_in_time', 'desc')
                         ->paginate($request->integer('per_page', 50));

        return response()->json($records);
    }

    /**
     * Export event attendance as CSV.
     */
    public function exportCSV(Event $event): StreamedResponse
    {
        $filename = 'attendance_' . str_replace(' ', '_', $event->title) . '_' . $event->date->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($event) {
            $handle = fopen('php://output', 'w');

            // Header
            fputcsv($handle, [
                'Student Name',
                'Email',
                'Student ID',
                'Check-in Time',
                'Method',
                'Status',
            ]);

            // Rows
            $event->attendances()
                ->with('user:id,name,email,student_id')
                ->orderBy('check_in_time')
                ->chunk(200, function ($rows) use ($handle) {
                    foreach ($rows as $record) {
                        fputcsv($handle, [
                            $record->user->name ?? 'N/A',
                            $record->user->email ?? 'N/A',
                            $record->user->student_id ?? 'N/A',
                            $record->check_in_time?->format('Y-m-d H:i:s'),
                            $record->method,
                            $record->status,
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
