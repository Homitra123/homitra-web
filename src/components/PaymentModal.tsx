import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, getSupabaseUrl } from '../lib/supabase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  amount: number;
  bookingData: any;
  onClose: () => void;
}

const PaymentModal = ({ amount, bookingData, onClose }: PaymentModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  console.log('PaymentModal initialized with booking data:', bookingData);
  console.log('Amount:', amount);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      setError('Failed to load payment gateway. Please refresh and try again.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const completeBooking = async (razorpayPaymentId: string) => {
    try {
      console.log('=== STARTING BOOKING SAVE TO SUPABASE ===');
      console.log('Razorpay Payment ID received:', razorpayPaymentId);
      console.log('User ID:', user?.id);
      console.log('User email:', user?.email);

      const targetUrl = getSupabaseUrl();
      console.log('=== TARGET DATABASE URL ===');
      console.log('Using Supabase URL:', targetUrl);
      console.log('URL is HTTPS:', targetUrl.startsWith('https://'));
      console.log('URL has no port:', !targetUrl.match(/:\d+$/));

      if (!targetUrl.startsWith('https://')) {
        throw new Error('Insecure URL detected - aborting database operation');
      }

      if (!user?.id) {
        const errorMsg = 'User is not authenticated';
        console.error(errorMsg);
        alert('Authentication Error: ' + errorMsg);
        throw new Error(errorMsg);
      }

      if (!bookingData.date) {
        const errorMsg = 'Missing required field: date';
        console.error(errorMsg);
        alert('Database Error: ' + errorMsg);
        throw new Error(errorMsg);
      }

      if (!bookingData.timeSlot) {
        const errorMsg = 'Missing required field: timeSlot';
        console.error(errorMsg);
        alert('Database Error: ' + errorMsg);
        throw new Error(errorMsg);
      }

      if (!bookingData.location) {
        const errorMsg = 'Missing required field: location';
        console.error(errorMsg);
        alert('Database Error: ' + errorMsg);
        throw new Error(errorMsg);
      }

      const cleanedDates = Array.isArray(bookingData.dates)
        ? bookingData.dates.filter((d: any) => typeof d === 'string')
        : [String(bookingData.date)];

      const cleanedWeekdays = Array.isArray(bookingData.weekdays)
        ? bookingData.weekdays.filter((w: any) => typeof w === 'string')
        : [];

      const bookingRecord = {
        user_id: String(user.id),
        service_id: String(bookingData.serviceId),
        service_name: String(bookingData.serviceName),
        tier: String(bookingData.tier || 'Standard'),
        booking_mode: String(bookingData.bookingMode || 'single'),
        duration: String(bookingData.duration || '60 min'),
        date: String(bookingData.date),
        dates: cleanedDates,
        weekdays: cleanedWeekdays,
        time_slot: String(bookingData.timeSlot),
        flexible_bookings: bookingData.flexibleBookings || null,
        location: String(bookingData.location),
        address: String(bookingData.address || ''),
        price: Number(amount),
        visits: Number(bookingData.visits || 1),
        status: 'confirmed',
        payment_id: String(razorpayPaymentId),
      };

      console.log('FINAL DATA OBJECT (all primitives):', bookingRecord);
      console.log('=== DIRECT INSERT TO:', `${targetUrl}/rest/v1/bookings`);
      console.log('=== ATTEMPTING SUPABASE INSERT WITH 5 SECOND TIMEOUT ===');

      const insertPromise = supabase
        .from('bookings')
        .insert([bookingRecord])
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database Connection Timeout - Possible Browser Block')), 5000)
      );

      const response = await Promise.race([insertPromise, timeoutPromise]) as any;

      console.log('=== SUPABASE RESPONSE RECEIVED ===');
      console.log('Supabase Response:', response);

      if (response.error) {
        console.error('=== SUPABASE ERROR ===');
        console.error('Error code:', response.error.code);
        console.error('Error message:', response.error.message);
        console.error('Error details:', JSON.stringify(response.error, null, 2));
        alert('Database Error: ' + response.error.message);
        throw response.error;
      }

      console.log('=== BOOKING SAVED SUCCESSFULLY ===');
      console.log('Booking ID:', response.data?.id);
      return response.data;
    } catch (error: any) {
      console.error('=== COMPLETE BOOKING ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Full error:', error);

      if (!error.message) {
        alert('Database Connection Failed: Unknown error occurred');
      } else if (error.message.includes('Timeout') || error.message.includes('Browser Block')) {
        alert('Database Connection Timeout - Possible Browser Block. Check console for Mixed Content errors.');
      } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        alert('Database Connection Failed: Unable to connect to database. Check your internet connection.');
      } else if (error.message.includes('CORS')) {
        alert('Database Connection Failed: CORS policy error. Check browser console.');
      } else {
        alert('Database Connection Failed: ' + error.message);
      }

      throw error;
    } finally {
      console.log('=== COMPLETE BOOKING FUNCTION FINISHED ===');
    }
  };

  const handlePayment = async () => {
    if (!user || !profile) {
      setError('You must be logged in to complete booking');
      return;
    }

    if (!razorpayLoaded) {
      setError('Payment gateway is loading. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: 'Homitra',
        description: bookingData.serviceName,
        image: '/Home_Assiatnt_Pic.png',
        handler: async function (response: any) {
          console.log('=== PAYMENT SUCCESSFUL ===');
          console.log('Payment response:', response);
          console.log('Razorpay Payment ID:', response.razorpay_payment_id);

          try {
            const booking = await completeBooking(response.razorpay_payment_id);

            if (booking && booking.id) {
              console.log('Database confirmed. Navigating to success page with booking ID:', booking.id);
              navigate(`/booking-success?booking_id=${booking.id}`, { replace: true });
            } else {
              console.warn('Booking created but no ID returned, navigating to bookings page');
              navigate('/bookings', { replace: true });
            }
          } catch (err: any) {
            console.error('=== ERROR COMPLETING BOOKING ===');
            console.error('Error:', err);
            setError('Payment successful but failed to save booking. Please contact support with payment ID: ' + response.razorpay_payment_id);
          } finally {
            console.log('=== PAYMENT HANDLER CLEANUP ===');
            setIsProcessing(false);
            onClose();
          }
        },
        prefill: {
          name: profile.full_name || '',
          email: user.email || '',
          contact: profile.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setError(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount to Pay</span>
              <span className="text-2xl font-bold text-blue-600">₹{amount}</span>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Service</p>
              <p className="font-semibold text-gray-900">{bookingData.serviceName}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Tier</p>
              <p className="font-semibold text-gray-900">{bookingData.tier}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isProcessing || !razorpayLoaded}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {!razorpayLoaded ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Loading Payment Gateway...</span>
              </>
            ) : isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Opening Payment Gateway...</span>
              </>
            ) : (
              <span>Pay ₹{amount}</span>
            )}
          </button>

          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Secured by Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
