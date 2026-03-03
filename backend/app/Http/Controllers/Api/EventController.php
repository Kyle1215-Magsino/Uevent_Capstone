<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            'status' => ['sometimes', 'in:draft,upcoming,ongoing,completed,cancelled'],
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
            'status' => ['sometimes', 'in:draft,upcoming,ongoing,completed,cancelled'],
        ]);

        $event->update($validated);
        $event->load('organizer:id,name,email');

        return response()->json($event);
    }

    /**
     * Delete an event.
     */
    public function destroy(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        if ($user->isOrganizer() && $event->organizer_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully.']);
    }
}
