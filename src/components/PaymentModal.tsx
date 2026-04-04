import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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

  const completeBooking = async (paymentId: string) => {
    console.log('Starting booking save to Supabase...');

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

    const bookingRecord = {
      user_id: user!.id,
      service_id: bookingData.serviceId,
      service_name: bookingData.serviceName,
      tier: bookingData.tier || 'Standard',
      booking_mode: bookingData.bookingMode || 'single',
      duration: bookingData.duration || '60 min',
      date: bookingData.date,
      dates: bookingData.dates || [bookingData.date],
      weekdays: bookingData.weekdays || [],
      time_slot: bookingData.timeSlot,
      flexible_bookings: bookingData.flexibleBookings || null,
      location: bookingData.location,
      address: bookingData.address,
      price: amount,
      visits: bookingData.visits || 1,
      status: 'confirmed',
      payment_id: paymentId,
    };

    console.log('Booking data being inserted:', bookingRecord);

    const { data: insertedBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([bookingRecord])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase Error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      alert('Database Error: ' + insertError.message);
      throw insertError;
    }

    console.log('Booking saved successfully:', insertedBooking);
    return insertedBooking;
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
          console.log('Payment successful:', response);
          console.log('Razorpay Payment ID:', response.razorpay_payment_id);

          try {
            const booking = await completeBooking(response.razorpay_payment_id);

            if (booking && booking.id) {
              console.log('Database confirmed. Navigation to success page with booking ID:', booking.id);
              setIsProcessing(false);
              navigate(`/booking-success?booking_id=${booking.id}`, { replace: true });
            } else {
              console.warn('Booking created but no ID returned, navigating to bookings page');
              setIsProcessing(false);
              navigate('/bookings', { replace: true });
            }
          } catch (err: any) {
            console.error('Error completing booking:', err);
            setError('Payment successful but failed to save booking. Please contact support.');
            setIsProcessing(false);
          } finally {
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
