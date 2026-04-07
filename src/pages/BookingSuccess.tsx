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

    console.log('[BookingSuccess] ==> Starting fetch, bookingId:', bookingId);

    try {
      console.log('[BookingSuccess] Step 1: Getting session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[BookingSuccess] Session error:', sessionError);
        navigate('/login');
        return;
      }

      if (!session) {
        console.error('[BookingSuccess] No session found');
        navigate('/login');
        return;
      }

      console.log('[BookingSuccess] ✓ Session valid');

      console.log('[BookingSuccess] Step 2: Getting user');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('[BookingSuccess] User error:', userError);
        navigate('/login');
        return;
      }

      if (!user) {
        console.error('[BookingSuccess] No user found');
        navigate('/login');
        return;
      }

      console.log('[BookingSuccess] ✓ User found:', user.id);

      console.log('[BookingSuccess] Step 3: Waiting 2 seconds for DB sync');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const baseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();

      console.log('[BookingSuccess] Step 4: Constructing HTTPS URL');
      console.log('[BookingSuccess] Base URL:', baseUrl);

      const urlObject = new URL(`${baseUrl}/rest/v1/bookings`);
      urlObject.protocol = 'https:';

      if (bookingId) {
        urlObject.searchParams.set('id', `eq.${bookingId}`);
        console.log('[BookingSuccess] Query by booking_id:', bookingId);
      } else {
        urlObject.searchParams.set('user_id', `eq.${user.id}`);
        urlObject.searchParams.set('order', 'created_at.desc');
        console.log('[BookingSuccess] Query by user_id:', user.id);
      }
      urlObject.searchParams.set('limit', '1');

      const finalUrl = urlObject.toString();
      console.log('[BookingSuccess] ✓ Final URL:', finalUrl);
      console.log('[BookingSuccess] URL protocol:', urlObject.protocol);

      console.log('[BookingSuccess] Step 5: Executing fetch with 5s timeout');

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

      console.log('[BookingSuccess] ✓ Response received, status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[BookingSuccess] Response data:', data);

        if (data && data.length > 0) {
          console.log('[BookingSuccess] ✓ Booking loaded:', data[0].id);
          setBooking(data[0]);
        } else {
          console.warn('[BookingSuccess] No booking data returned');
        }
      } else {
        const errorText = await response.text();
        console.error('[BookingSuccess] HTTP error:', response.status, errorText);
      }
    } catch (err: any) {
      console.error('[BookingSuccess] ✗ Fatal error:', err);
      console.error('[BookingSuccess] Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    } finally {
      setContentLoading(false);
      console.log('[BookingSuccess] Fetch complete, contentLoading set to false');
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
                <p className="text-gray-600 text-lg mb-4">Your booking was successful!</p>
                <p className="text-gray-500 mb-6">Booking details will appear shortly. You can view them in your bookings dashboard.</p>
                <Link
                  to="/bookings"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <span>Go to My Bookings</span>
                  <ArrowRight size={20} />
                </Link>
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
