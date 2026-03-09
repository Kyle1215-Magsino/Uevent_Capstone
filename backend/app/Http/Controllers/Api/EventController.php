<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    /**
     * List events — admins see all, organizers see their own, students see upcoming.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Event::with('organizer:id,name,email');

        if ($user->isOrganizer()) {
            $query->byOrganizer($user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Exclude archived events by default
            $query->where('status', '!=', 'archived');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('venue', 'like', "%{$search}%");
            });
        }

        $events = $query->orderBy('date', 'desc')
                        ->orderBy('start_time', 'desc')
                        ->paginate($request->integer('per_page', 15));

        return response()->json($events);
    }

    /**
     * Get upcoming events.
     */
    public function upcoming(): JsonResponse
    {
        $events = Event::with('organizer:id,name,email')
                       ->upcoming()
                       ->limit(20)
                       ->get();

        return response()->json($events);
    }

    /**
     * Show a single event with attendance summary.
     */
    public function show(Event $event): JsonResponse
    {
        $event->load('organizer:id,name,email');
        $event->loadCount([
            'attendances as present_count' => fn ($q) => $q->where('status', 'present'),
            'attendances as late_count' => fn ($q) => $q->where('status', 'late'),
            'attendances as absent_count' => fn ($q) => $q->where('status', 'absent'),
            'attendances as total_attendees',
        ]);

        return response()->json($event);
    }

    /**
     * Create a new event.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'venue' => ['required', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'attendance_method' => ['sometimes', 'in:facial,rfid,manual,any'],
            'status' => ['sometimes', 'in:draft,upcoming,ongoing,completed,cancelled,archived'],
        ]);

        $validated['organizer_id'] = $request->user()->id;

        $event = Event::create($validated);
        $event->load('organizer:id,name,email');

        return response()->json($event, 201);
    }

    /**
     * Update an event.
     */
    public function update(Request $request, Event $event): JsonResponse
    {
        // Organizers can only edit their own events
        $user = $request->user();
        if ($user->isOrganizer() && $event->organizer_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'venue' => ['sometimes', 'string', 'max:255'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'attendance_method' => ['sometimes', 'in:facial,rfid,manual,any'],
            'status' => ['sometimes', 'in:draft,upcoming,ongoing,completed,cancelled,archived'],
        ]);

        $event->update($validated);
        $event->load('organizer:id,name,email');

        return response()->json($event);
    }

    /**
     * Delete an event permanently.
     */
    public function destroy(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        if ($user->isOrganizer() && $event->organizer_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        try {
            $event->delete();
            Log::info("Event {$event->id} deleted by user {$user->id}");
            return response()->json(['message' => 'Event deleted successfully.']);
        } catch (\Exception $e) {
            Log::error("Failed to delete event {$event->id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to delete event: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Archive an event (set status to archived).
     */
    public function archive(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        if ($user->isOrganizer() && $event->organizer_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($event->status === 'archived') {
            return response()->json(['message' => 'Event is already archived.'], 422);
        }

        try {
            $event->update(['status' => 'archived']);
            Log::info("Event {$event->id} archived by user {$user->id}");
            return response()->json(['message' => 'Event archived successfully.']);
        } catch (\Exception $e) {
            Log::error("Failed to archive event {$event->id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to archive event: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Restore an archived event (set status back to upcoming).
     */
    public function restore(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        if ($user->isOrganizer() && $event->organizer_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($event->status !== 'archived') {
            return response()->json(['message' => 'Event is not archived.'], 422);
        }

        try {
            $event->update(['status' => 'upcoming']);
            Log::info("Event {$event->id} restored by user {$user->id}");
            return response()->json(['message' => 'Event restored successfully.']);
        } catch (\Exception $e) {
            Log::error("Failed to restore event {$event->id}: " . $e->getMessage());
            return response()->json(['message' => 'Failed to restore event: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk archive events.
     */
    public function bulkArchive(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:events,id'],
        ]);

        $user = $request->user();

        try {
            $query = Event::whereIn('id', $validated['ids'])
                          ->where('status', '!=', 'archived');

            // Organizers can only archive their own events
            if ($user->isOrganizer()) {
                $query->where('organizer_id', $user->id);
            }

            $archivedCount = $query->update(['status' => 'archived']);
            Log::info("Bulk archive: {$archivedCount} event(s) archived by user {$user->id}, requested IDs: " . implode(',', $validated['ids']));

            return response()->json([
                'message' => "{$archivedCount} event(s) archived successfully.",
                'archived_count' => $archivedCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Bulk archive failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to archive events: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk restore archived events.
     */
    public function bulkRestore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:events,id'],
        ]);

        $user = $request->user();

        try {
            $query = Event::whereIn('id', $validated['ids'])
                          ->where('status', 'archived');

            if ($user->isOrganizer()) {
                $query->where('organizer_id', $user->id);
            }

            $restoredCount = $query->update(['status' => 'upcoming']);
            Log::info("Bulk restore: {$restoredCount} event(s) restored by user {$user->id}, requested IDs: " . implode(',', $validated['ids']));

            return response()->json([
                'message' => "{$restoredCount} event(s) restored successfully.",
                'restored_count' => $restoredCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Bulk restore failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to restore events: ' . $e->getMessage()], 500);
        }
    }
}
