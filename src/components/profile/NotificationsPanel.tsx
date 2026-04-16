import { useEffect, useState } from 'react';
import { X, Bell, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface BookingNotification {
  id: string;
  service_name: string;
  booking_date: string;
  time_slot: string;
  status: string;
  created_at: string;
}

interface Props {
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle },
  partner_assigned: { label: 'Partner Assigned', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Loader2 },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertCircle },
};

const isActive = (status: string) =>
  ['pending', 'confirmed', 'partner_assigned', 'in_progress'].includes(status);

const NotificationsPanel = ({ onClose }: Props) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('id, service_name, booking_date, time_slot, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setBookings(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const activeBookings = bookings.filter(b => isActive(b.status));
  const completedBookings = bookings.filter(b => !isActive(b.status));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const BookingCard = ({ booking }: { booking: BookingNotification }) => {
    const cfg = statusConfig[booking.status] ?? statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <div className={`border rounded-xl p-4 ${cfg.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{booking.service_name}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {formatDate(booking.booking_date)}
              {booking.time_slot ? ` · ${booking.time_slot}` : ''}
            </p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} whitespace-nowrap`}>
            <Icon size={12} />
            {cfg.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Bell size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="text-sm text-gray-500">Loading your requests...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Bell size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">No bookings yet</p>
              <p className="text-sm text-gray-500 mt-1">Your service requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeBookings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Requests</p>
                  <div className="space-y-3">
                    {activeBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </div>
              )}
              {completedBookings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Requests</p>
                  <div className="space-y-3">
                    {completedBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
