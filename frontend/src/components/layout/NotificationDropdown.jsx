import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Calendar, ScanFace, UserCheck, X } from 'lucide-react';
import { notificationsAPI } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const ICON_MAP = {
  new_event: { icon: Calendar, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40' },
  check_in: { icon: UserCheck, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40' },
  enrollment_approved: { icon: ScanFace, color: 'text-green-500 bg-green-100 dark:bg-green-900/40' },
  enrollment_rejected: { icon: ScanFace, color: 'text-red-500 bg-red-100 dark:bg-red-900/40' },
};

function getIcon(type) {
  return ICON_MAP[type] || { icon: Bell, color: 'text-slate-500 bg-slate-100 dark:bg-slate-700' };
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getNotificationLink(notification, role) {
  const eventId = notification.data?.event_id;
  switch (notification.type) {
    case 'new_event':
    case 'check_in':
      if (role === 'admin' && eventId) return `/admin/events/${eventId}`;
      if (role === 'organizer') return '/organizer/events';
      return '/student/events';
    case 'enrollment_approved':
    case 'enrollment_rejected':
      if (role === 'admin') return '/admin/enrollments';
      return '/student/enrollment';
    default:
      return null;
  }
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // silently fail
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll({ per_page: 20 });
      setNotifications(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.read_at) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // silently fail
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
    // Navigate to the relevant page
    const link = getNotificationLink(notification, user?.role);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors dark:hover:text-slate-300 dark:hover:bg-slate-700"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white dark:ring-slate-800">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 animate-scale-in dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                >
                  <CheckCheck className="w-3.5 h-3.5 inline mr-1" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const { icon: Icon, color } = getIcon(notification.type);
                const isUnread = !notification.read_at;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors group cursor-pointer',
                      isUnread
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:border-slate-700/50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300')}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 dark:text-slate-400">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
