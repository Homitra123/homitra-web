import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, IndianRupee, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingDetails {
  id: string;
  service_name: string;
  date: string;
  time_slot: string;
  address: string;
  price: number;
  tier: string;
  created_at: string;
}

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showEmptyState, setShowEmptyState] = useState(false);

  const fetchBooking = async () => {
    const bookingId = searchParams.get('booking_id');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let url: string;
      if (bookingId) {
        url = `https://talcyiifgehpcphwotej.supabase.co/rest/v1/bookings?id=eq.${bookingId}&limit=1`;
      } else {
        url = `https://talcyiifgehpcphwotej.supabase.co/rest/v1/bookings?user_id=eq.${user.id}&order=created_at.desc&limit=1`;
      }

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error fetching booking:', response.status, response.statusText);
        return null;
      } else {
        const data = await response.json();
        if (data && data.length > 0) {
          return data[0];
        } else {
          console.log('No booking found yet, attempt:', retryCount + 1);
          return null;
        }
      }
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  };

  useEffect(() => {
    const attemptFetch = async () => {
      setLoading(true);
      const result = await fetchBooking();

      if (result) {
        setBooking(result);
        setLoading(false);
      } else if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      } else {
        setShowEmptyState(true);
        setLoading(false);
      }
    };

    attemptFetch();
  }, [retryCount, searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your booking details...</p>
          {retryCount > 0 && (
            <p className="text-gray-500 text-sm mt-2">Retry attempt {retryCount + 1} of 3</p>
          )}
        </div>
      </div>
    );
  }

  const formattedDate = booking ? new Date(booking.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={80} className="text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h1>
            <p className="text-green-50 text-lg">Your service has been successfully booked</p>
          </div>

          <div className="p-8">
            {booking && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">Booking ID</h2>
                    <p className="text-lg font-mono text-gray-900">{booking.id.slice(0, 13).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">Booked On</h2>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(booking.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {booking ? (
              <>
                <div className="space-y-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h3>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Service</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.service_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="text-lg font-semibold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Time</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.time_slot}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Address</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Total Amount Paid</p>
                      <p className="text-3xl font-bold text-white">₹{booking.price}</p>
                    </div>
                    <CheckCircle size={48} className="text-blue-200" />
                  </div>
                </div>
              </>
            ) : showEmptyState ? (
              <div className="mb-8 text-center">
                <div className="bg-blue-50 rounded-2xl p-8 mb-6">
                  <CheckCircle size={64} className="text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Payment Confirmed!</h3>
                  <p className="text-gray-700 text-lg mb-6">
                    Your booking is saved. You can see details in your Profile.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        setRetryCount(0);
                        setShowEmptyState(false);
                        setLoading(true);
                      }}
                      className="bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Refresh to Load Details
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="bg-gray-100 text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Go to Home
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>You will receive a confirmation email shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Our service professional will contact you before the scheduled time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>You can view this booking anytime in the Bookings section</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/bookings')}
                className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>View My Bookings</span>
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-100 text-gray-900 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
