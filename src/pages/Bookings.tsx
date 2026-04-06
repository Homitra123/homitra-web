import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, MapPin, Clock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Booking, withTimeout, fetchWithNativeFallback } from '../lib/supabase';

const Bookings = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (location.state?.showSuccess) {
      setShowSuccessBanner(true);
      window.history.replaceState({}, document.title);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) {
      console.log('[Bookings] No user found');
      return;
    }

    console.log('[Bookings] Starting fetch for user UUID:', user.id);
    setLoading(true);
    setError(false);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.access_token) {
        console.error('[Bookings] Auth Token Missing - No session or access_token');
        setError(true);
        setErrorMessage('Session expired. Please log out and log back in.');
        setLoading(false);
        return;
      }

      console.log('[Bookings] Session found, attempting Supabase client with 10s timeout');

      try {
        const { data, error: fetchError } = await withTimeout(
          supabase
            .from('bookings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          10000,
          'Supabase SDK timeout'
        );

        console.log('[Bookings] Supabase query result - Data:', data?.length, 'Error:', fetchError);

        if (fetchError) {
          console.error('[Bookings] Supabase error:', fetchError);
          setError(true);
          setErrorMessage(`Error loading bookings: ${fetchError.message}`);
          setBookings([]);
        } else if (data) {
          console.log('[Bookings] Successfully loaded', data.length, 'bookings for account UUID:', user.id);
          setBookings(data);
          setError(false);

          if (data.length === 0) {
            console.log('[Bookings] Empty result - No bookings found for this account');
          }
        } else {
          console.error('[Bookings] Unexpected: No data and no error');
          setError(true);
          setErrorMessage('Unexpected response from server');
          setBookings([]);
        }
      } catch (timeoutErr: any) {
        if (timeoutErr.message === 'Supabase SDK timeout') {
          console.warn('[Bookings] SDK timed out, switching to native fetch fallback');
          try {
            const fallbackData = await fetchWithNativeFallback('bookings', user.id, session.access_token);
            console.log('[Bookings] Fallback successful - loaded', fallbackData.length, 'bookings');
            setBookings(fallbackData);
            setError(false);
          } catch (fallbackErr: any) {
            console.error('[Bookings] Fallback also failed:', fallbackErr);
            setError(true);
            setErrorMessage('Unable to load bookings. Network may be blocked.');
            setBookings([]);
          }
        } else {
          throw timeoutErr;
        }
      }
    } catch (err) {
      console.error('[Bookings] Fetch error:', err);
      setError(true);
      setErrorMessage('Network error. Please check your connection and try again.');
      setBookings([]);
    }

    setLoading(false);
  };

  const activeBookings = bookings.filter(
    b => b.status !== 'completed' && b.status !== 'cancelled'
  );
  const completedBookings = bookings.filter(
    b => b.status === 'completed' || b.status === 'cancelled'
  );

  const displayedBookings = activeTab === 'active' ? activeBookings : completedBookings;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      partner_assigned: { label: 'Partner Assigned', color: 'bg-green-100 text-green-800' },
      in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Bookings</h2>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'We couldn\'t fetch your bookings. Please try again.'}
          </p>
          <button
            onClick={fetchBookings}
            className="bg-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24">
      {showSuccessBanner && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Booking Confirmed!</p>
            <p className="text-sm text-green-700">Your service has been successfully booked.</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600 text-lg">Track and manage your service bookings</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 bg-white rounded-xl p-1 border border-gray-200 inline-flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({completedBookings.length})
          </button>
        </div>
      </div>

      {displayedBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {bookings.length === 0 ? 'No bookings found for your account ID' : `No ${activeTab} bookings`}
          </h3>
          <p className="text-gray-600 mb-2">
            {bookings.length === 0
              ? "You haven't made any bookings yet. Start booking services to see them here."
              : activeTab === 'active'
              ? "You don't have any active bookings at the moment."
              : "You haven't completed any bookings yet."}
          </p>
          {bookings.length === 0 && user && (
            <p className="text-xs text-gray-400 font-mono mt-2">Account ID: {user.id.slice(0, 8)}...</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{booking.service_name}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-gray-600">Booking ID: {booking.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹{booking.price}</p>
                  <p className="text-sm text-gray-500">{booking.tier}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Calendar size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-gray-900 font-medium">{formatDate(booking.date)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Time Slot</p>
                    <p className="text-gray-900 font-medium">{booking.time_slot}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900 font-medium">{booking.location}</p>
                    <p className="text-gray-600 text-sm">{booking.address}</p>
                  </div>
                </div>
                {booking.partner_name && (
                  <div className="flex items-start space-x-3">
                    <User size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Service Partner</p>
                      <p className="text-gray-900 font-medium">{booking.partner_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {booking.status === 'in_progress' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mt-4">
                  <p className="text-purple-900 font-medium">
                    Your service is currently in progress
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    The partner will notify you once completed
                  </p>
                </div>
              )}

              {booking.status === 'partner_assigned' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                  <p className="text-green-900 font-medium">
                    Partner assigned and will arrive at scheduled time
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
