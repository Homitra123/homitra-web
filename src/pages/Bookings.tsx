import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, MapPin, Clock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Booking, getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';

const Bookings = () => {
  const { user } = useAuth();
  const location = useLocation();
  const hasLoadedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState({
    currentUserId: '',
    fetchStatus: '',
    rawDataCount: 0,
    timestamp: '',
    loadAttempts: 0,
  });

  useEffect(() => {
    if (location.state?.showSuccess) {
      setShowSuccessBanner(true);
      window.history.replaceState({}, document.title);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  }, [location]);

  useEffect(() => {
    console.log('[Bookings] Component mounted, triggering fetch');
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchBookings();
    }
  }, []);

  const fetchBookings = async () => {
    const attemptNumber = (debugInfo.loadAttempts || 0) + 1;

    console.log('[Bookings] ==> Fetch attempt #', attemptNumber, 'starting...');

    setContentLoading(true);
    setError(false);
    setErrorMessage('');

    try {
      console.log('[Bookings] Step 1: Getting fresh user from Supabase auth');
      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('[Bookings] Error getting user:', userError);
        throw userError;
      }

      if (!freshUser) {
        console.error('[Bookings] No user found in session');
        setError(true);
        setErrorMessage('Please log in to view bookings.');
        setDebugInfo(prev => ({ ...prev, currentUserId: 'N/A', fetchStatus: 'Not started' }));
        setContentLoading(false);
        return;
      }

      console.log('[Bookings] ✓ User found:', freshUser.id);

      setDebugInfo(prev => ({
        ...prev,
        currentUserId: freshUser.id,
        fetchStatus: 'Fetching...',
        rawDataCount: 0,
        timestamp: new Date().toLocaleTimeString(),
        loadAttempts: attemptNumber,
      }));

      console.log('[Bookings] Step 2: Getting session for auth token');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[Bookings] Error getting session:', sessionError);
        throw sessionError;
      }

      if (!session || !session.access_token) {
        console.error('[Bookings] No valid session or access token');
        setError(true);
        setErrorMessage('Session expired. Please log out and log back in.');
        setDebugInfo(prev => ({ ...prev, fetchStatus: 'Auth Failed' }));
        setContentLoading(false);
        return;
      }

      console.log('[Bookings] ✓ Session valid, token length:', session.access_token.length);

      const baseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();

      console.log('[Bookings] Step 3: Constructing HTTPS URL');
      console.log('[Bookings] Base URL:', baseUrl);

      const urlObject = new URL(`${baseUrl}/rest/v1/bookings`);
      urlObject.protocol = 'https:';
      urlObject.searchParams.set('user_id', `eq.${freshUser.id}`);
      urlObject.searchParams.set('order', 'created_at.desc');

      const finalUrl = urlObject.toString();
      console.log('[Bookings] ✓ Final URL:', finalUrl);
      console.log('[Bookings] URL protocol:', urlObject.protocol);

      console.log('[Bookings] Step 4: Executing fetch with 5s timeout');

      const response = await Promise.race([
        fetch(finalUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Origin': 'https://www.homitra.co.in',
          },
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout after 5s')), 5000)
        ),
      ]) as Response;

      console.log('[Bookings] ✓ Response received, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Bookings] HTTP error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Bookings] ✓ Successfully loaded', data.length, 'bookings');
      console.log('[Bookings] Booking IDs:', data.map((b: Booking) => b.id.slice(0, 8)).join(', '));

      setBookings(data);
      setError(false);
      setDebugInfo(prev => ({ ...prev, fetchStatus: 'Success', rawDataCount: data.length }));
    } catch (err: any) {
      console.error('[Bookings] ✗ Fatal error:', err);
      console.error('[Bookings] Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });

      if (bookings.length === 0) {
        setError(true);
        setErrorMessage('Unable to load bookings. Please try again.');
      }
      setDebugInfo(prev => ({ ...prev, fetchStatus: 'Error: ' + err.message }));
    } finally {
      setContentLoading(false);
      console.log('[Bookings] Fetch complete, contentLoading set to false');
    }
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
      timeZone: 'Asia/Kolkata',
    });
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 bg-black text-white p-4 rounded-xl font-mono text-xs shadow-2xl z-50 max-w-2xl mx-auto">
        <div className="font-bold mb-2 text-yellow-400">DEBUG INFO - PERSISTENT</div>
        <div className="space-y-1">
          <div><span className="text-gray-400">Current User UUID:</span> {debugInfo.currentUserId.slice(0, 20) || 'N/A'}...</div>
          <div><span className="text-gray-400">Fetch Status:</span> {debugInfo.fetchStatus || 'Not started'}</div>
          <div><span className="text-gray-400">Raw Data Count:</span> {debugInfo.rawDataCount}</div>
          <div><span className="text-gray-400">Timestamp:</span> {debugInfo.timestamp || 'N/A'}</div>
          <div><span className="text-gray-400">Load Attempts:</span> {debugInfo.loadAttempts}</div>
          <div><span className="text-gray-400">Content Loading:</span> {contentLoading ? 'TRUE' : 'FALSE'}</div>
        </div>
      </div>

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

        {contentLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 text-sm">Checking for bookings...</p>
            </div>
          </div>
        ) : error && bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Bookings</h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'We couldn\'t fetch your bookings. Please try again.'}
            </p>
            <button
              onClick={() => fetchBookings()}
              className="bg-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {bookings.length === 0 ? 'No bookings found yet' : `No ${activeTab} bookings`}
            </h3>
            <p className="text-gray-600 mb-2">
              {bookings.length === 0
                ? "Your first booking will appear here after payment."
                : activeTab === 'active'
                ? "You don't have any active bookings at the moment."
                : "You haven't completed any bookings yet."}
            </p>
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
    </>
  );
};

export default Bookings;
