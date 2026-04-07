import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, IndianRupee, ArrowRight } from 'lucide-react';
import { supabase, getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';

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
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [searchParams]);

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

      console.log('[BookingSuccess] Fetching with native fetch, bookingId:', bookingId);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const baseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();

      let url: string;
      if (bookingId) {
        url = `${baseUrl}/rest/v1/bookings?id=eq.${bookingId}&limit=1`;
      } else {
        url = `${baseUrl}/rest/v1/bookings?user_id=eq.${user.id}&order=created_at.desc&limit=1`;
      }

      const response = await Promise.race([
        fetch(url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 2000)
        ),
      ]) as Response;

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          console.log('[BookingSuccess] Loaded booking:', data[0]);
          setBooking(data[0]);
        }
      }
    } catch (err) {
      console.error('[BookingSuccess] Error:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const formattedDate = booking ? new Date(booking.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  }) : '';

  const formattedTime = booking ? new Date(booking.created_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true
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
            {contentLoading ? (
              <div className="mb-8 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading your booking details...</p>
              </div>
            ) : booking ? (
              <>
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">Booking ID</h2>
                      <p className="text-lg font-mono text-gray-900">{booking.id.slice(0, 13).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">Booked On</h2>
                      <p className="text-lg font-semibold text-gray-900">
                        {formattedTime} IST
                      </p>
                    </div>
                  </div>
                </div>

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
                      <IndianRupee className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tier</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{booking.tier}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="text-lg font-semibold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Time</p>
                      <p className="text-lg font-semibold text-gray-900">{booking.time_slot} IST</p>
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
            ) : (
              <div className="mb-8 text-center py-12">
                <p className="text-gray-600 text-lg mb-4">Your booking details will appear here shortly.</p>
                <p className="text-gray-500">Check your bookings dashboard to view all details.</p>
              </div>
            )}

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
              <Link
                to="/bookings"
                className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>View My Bookings</span>
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/"
                className="flex-1 bg-gray-100 text-gray-900 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
