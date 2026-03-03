<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'date',
        'start_time',
        'end_time',
        'venue',
        'capacity',
        'attendance_method',
        'status',
        'organizer_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'capacity' => 'integer',
        ];
    }

    // ── Relationships ──

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    // ── Scopes ──

    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', now()->toDateString())
                     ->whereIn('status', ['upcoming', 'ongoing'])
                     ->orderBy('date')
                     ->orderBy('start_time');
    }

    public function scopeByOrganizer($query, $organizerId)
    {
        return $query->where('organizer_id', $organizerId);
    }

    // ── Helpers ──

    public function attendeeCount(): int
    {
        return $this->attendances()->whereIn('status', ['present', 'late'])->count();
    }

    public function isAtCapacity(): bool
    {
        return $this->capacity && $this->attendeeCount() >= $this->capacity;
    }
}
