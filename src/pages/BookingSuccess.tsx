import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
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
}

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const bookingId =
    (location.state as { bookingId?: string })?.bookingId ||
    searchParams.get('booking_id');

  useEffect(() => {
    const load = async () => {
      try {
        let query = supabase.from('bookings').select('id, service_name, date, time_slot, address, price, tier');

        if (bookingId) {
          query = query.eq('id', bookingId);
        } else {
          query = query.order('created_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          setBooking(data[0]);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find your booking details. It may still be processing.
          </p>
          <Link
            to="/bookings"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <span>View All Bookings</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 text-center border-b border-green-100">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 text-lg">
            Your service has been successfully booked
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Service</p>
              <p className="text-xl font-bold text-gray-900">{booking.service_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tier</p>
              <p className="text-lg font-semibold text-gray-900">{booking.tier}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="font-semibold text-gray-900">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time Slot</p>
                <p className="font-semibold text-gray-900">{booking.time_slot}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Location</p>
                <p className="font-semibold text-gray-900">{booking.address}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <IndianRupee size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{booking.price}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Booking ID:</span> {booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              to="/bookings"
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/30"
            >
              <span>View My Bookings</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-4 rounded-xl font-semibold transition-colors text-center"
            >
              Book Another Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
