<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FacialEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacialEnrollmentController extends Controller
{
    /**
     * Submit a facial enrollment (student).
     */
    public function enroll(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if already enrolled
        $existing = FacialEnrollment::where('user_id', $user->id)->first();
        if ($existing && $existing->status !== 'rejected') {
            return response()->json([
                'message' => 'You already have a pending or approved enrollment.',
                'enrollment' => $existing,
            ], 409);
        }

        // If rejected, allow re-enrollment
        if ($existing && $existing->status === 'rejected') {
            $existing->delete();
        }

        $validated = $request->validate([
            'images_count' => ['required', 'integer', 'min:1', 'max:10'],
            'face_data' => ['nullable', 'string'],
        ]);

        $enrollment = FacialEnrollment::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'images_count' => $validated['images_count'],
            'face_data' => $validated['face_data'] ?? null,
            'submitted_at' => now(),
        ]);

        return response()->json($enrollment, 201);
    }

    /**
     * Get current user's enrollment status.
     */
    public function status(Request $request): JsonResponse
    {
        $enrollment = FacialEnrollment::where('user_id', $request->user()->id)->first();

        if (! $enrollment) {
            return response()->json(['status' => 'not_enrolled']);
        }

        return response()->json($enrollment);
    }

    /**
     * Delete enrollment (student).
     */
    public function destroy(Request $request): JsonResponse
    {
        FacialEnrollment::where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'Enrollment deleted successfully.']);
    }

    /**
     * List all enrollments (admin).
     */
    public function index(Request $request): JsonResponse
    {
        $query = FacialEnrollment::with('user:id,name,email,student_id');

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

        $enrollments = $query->orderBy('submitted_at', 'desc')
                             ->paginate($request->integer('per_page', 15));

        return response()->json($enrollments);
    }

    /**
     * Approve an enrollment (admin).
     */
    public function approve(Request $request, FacialEnrollment $enrollment): JsonResponse
    {
        $enrollment->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
        ]);

        return response()->json($enrollment->load('user:id,name,email,student_id'));
    }

    /**
     * Reject an enrollment (admin).
     */
    public function reject(Request $request, FacialEnrollment $enrollment): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $enrollment->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $validated['reason'] ?? null,
        ]);

        return response()->json($enrollment->load('user:id,name,email,student_id'));
    }

    /**
     * Get all approved enrollments with face data (for face matching at check-in).
     */
    public function enrolledFaces(): JsonResponse
    {
        $enrollments = FacialEnrollment::with('user:id,name,email,student_id')
            ->where('status', 'approved')
            ->whereNotNull('face_data')
            ->get(['id', 'user_id', 'face_data']);

        return response()->json($enrollments);
    }
}
