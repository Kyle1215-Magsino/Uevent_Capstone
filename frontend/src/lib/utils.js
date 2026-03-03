import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleBadgeColor(role) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'organizer':
      return 'bg-blue-100 text-blue-800';
    case 'student':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export function getStatusBadgeColor(status) {
  switch (status) {
    case 'active':
    case 'present':
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'upcoming':
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'cancelled':
    case 'absent':
      return 'bg-rose-100 text-rose-800';
    case 'ongoing':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}
