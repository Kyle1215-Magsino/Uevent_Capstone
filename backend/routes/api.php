<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FacialEnrollmentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ── Public (guest) ──
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ── Authenticated ──
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Events (all authenticated users)
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/upcoming', [EventController::class, 'upcoming']);
    Route::get('/events/{event}', [EventController::class, 'show']);

    // Attendance (my own)
    Route::get('/my-attendance', [AttendanceController::class, 'myAttendance']);

    // ── Check-in routes (student, organizer, admin) ──
    Route::middleware('role:student,organizer,admin')->group(function () {
        Route::post('/events/{event}/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('/events/{event}/face-check-in', [AttendanceController::class, 'faceCheckIn']);
        Route::post('/events/{event}/rfid-check-in', [AttendanceController::class, 'rfidCheckIn']);
        Route::post('/events/{event}/manual-check-in', [AttendanceController::class, 'manualCheckIn']);
        Route::get('/enrolled-faces', [FacialEnrollmentController::class, 'enrolledFaces']);
    });

    // ── Student routes ──
    Route::middleware('role:student')->group(function () {
        Route::post('/facial-enrollment', [FacialEnrollmentController::class, 'enroll']);
        Route::get('/facial-enrollment/status', [FacialEnrollmentController::class, 'status']);
        Route::delete('/facial-enrollment', [FacialEnrollmentController::class, 'destroy']);
    });

    // ── Organizer routes ──
    Route::middleware('role:organizer,admin')->group(function () {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
        Route::patch('/events/{event}/archive', [EventController::class, 'archive']);
        Route::patch('/events/{event}/restore', [EventController::class, 'restore']);
        Route::post('/events/bulk-archive', [EventController::class, 'bulkArchive']);
        Route::post('/events/bulk-restore', [EventController::class, 'bulkRestore']);

        // Attendance management
        Route::get('/events/{event}/attendance', [AttendanceController::class, 'byEvent']);
        Route::get('/events/{event}/live-dashboard', [AttendanceController::class, 'liveDashboard']);

        // Reports (organizer + admin)
        Route::get('/reports/events/{event}', [ReportController::class, 'eventReport']);
        Route::get('/reports/events/{event}/export', [ReportController::class, 'exportCSV']);
        Route::get('/reports/attendance', [ReportController::class, 'attendanceReport']);
    });

    // ── Admin-only routes ──
    Route::middleware('role:admin')->group(function () {
        // User management
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);

        // Facial enrollments admin
        Route::get('/facial-enrollments', [FacialEnrollmentController::class, 'index']);
        Route::patch('/facial-enrollments/{enrollment}/approve', [FacialEnrollmentController::class, 'approve']);
        Route::patch('/facial-enrollments/{enrollment}/reject', [FacialEnrollmentController::class, 'reject']);

        // Analytics
        Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/analytics/events', [AnalyticsController::class, 'eventStats']);
        Route::get('/analytics/attendance', [AnalyticsController::class, 'attendanceStats']);

        // Student attendance (admin view)
        Route::get('/students/{student}/attendance', [AttendanceController::class, 'byStudent']);
    });
});
