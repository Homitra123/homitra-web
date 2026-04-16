import { useEffect, useState } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Clock, Loader2, CheckCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  old_status: string | null;
  new_status: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  onClose: () => void;
}

const statusIconMap: Record<string, typeof Clock> = {
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: AlertCircle,
  in_progress: Loader2,
  pending: Clock,
};

const statusColorMap: Record<string, string> = {
  confirmed: 'text-blue-600 bg-blue-50',
  completed: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  in_progress: 'text-orange-600 bg-orange-50',
  pending: 'text-amber-600 bg-amber-50',
};

const NotificationsPanel = ({ onClose }: Props) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getIconConfig = (n: Notification) => {
    const status = n.new_status ?? 'pending';
    const Icon = statusIconMap[status] ?? Bell;
    const colorClass = statusColorMap[status] ?? 'text-gray-600 bg-gray-50';
    return { Icon, colorClass };
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[calc(100dvh-5rem)] sm:max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center relative">
              <Bell size={18} className="text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCheck size={14} />
                )}
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="text-sm text-gray-500">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Bell size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-1">Status updates on your bookings will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const { Icon, colorClass } = getIconConfig(n);
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      n.is_read
                        ? 'bg-white border-gray-100 hover:bg-gray-50'
                        : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                    }`}
                  >
                    {!n.is_read && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatTime(n.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
