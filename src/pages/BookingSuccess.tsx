import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, IndianRupee, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingDetails {
  id: string;
  service_name: string;
  service_date: string;
  service_time: string;
  address: string;
  total_price: number;
  payment_id: string;
  created_at: string;
}

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      const bookingId = searchParams.get('booking_id');

      if (!bookingId) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle();

        if (error || !data) {
          console.error('Error fetching booking:', error);
          navigate('/');
          return;
        }

        setBooking(data);
      } catch (err) {
        console.error('Error:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const formattedDate = new Date(booking.service_date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">Booking ID</h2>
              <p className="text-lg font-mono text-gray-900">{booking.id.slice(0, 13).toUpperCase()}</p>
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
                  <p className="text-lg font-semibold text-gray-900">{booking.service_time}</p>
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

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <IndianRupee className="text-emerald-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment ID</p>
                  <p className="text-lg font-mono text-gray-900">{booking.payment_id}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Amount Paid</p>
                  <p className="text-3xl font-bold text-white">₹{booking.total_price}</p>
                </div>
                <CheckCircle size={48} className="text-blue-200" />
              </div>
            </div>

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
