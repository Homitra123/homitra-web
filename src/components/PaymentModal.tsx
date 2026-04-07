import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';

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
      console.log('=== FIRE AND FORGET BOOKING SAVE ===');
      console.log('Razorpay Payment ID received:', razorpayPaymentId);

      if (!user?.id) {
        console.error('User is not authenticated');
        return { success: false };
      }

      if (!bookingData.date || !bookingData.timeSlot || !bookingData.location) {
        console.error('Missing required booking fields');
        return { success: false };
      }

      const bookingRecord = {
        user_id: user.id,
        service_id: bookingData.serviceId,
        service_name: bookingData.serviceName,
        tier: bookingData.tier || 'Standard',
        booking_mode: bookingData.bookingMode || 'single',
        duration: bookingData.duration || '1 hour',
        date: bookingData.date,
        time_slot: bookingData.timeSlot,
        location: bookingData.location,
        address: bookingData.address || bookingData.location,
        price: amount,
        status: 'pending',
        payment_id: razorpayPaymentId,
      };

      console.log('Booking record:', bookingRecord);

      const baseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();

      const urlObject = new URL(`${baseUrl}/rest/v1/bookings`);
      urlObject.protocol = 'https:';

      console.log('Supabase endpoint (HTTPS):', urlObject.toString());
      console.log('[PaymentModal] Using hardcoded anon key:', anonKey.substring(0, 20) + '...');

      fetch(urlObject.toString(), {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Origin': 'https://www.homitra.co.in',
        },
        body: JSON.stringify(bookingRecord),
      }).then(response => {
        console.log('Background insert status:', response.status);
        if (response.ok || response.status === 409) {
          console.log('✓ Booking saved successfully (or already exists)');
        } else {
          response.text().then(text => {
            console.error('✗ Booking save failed:', response.status, text);
          });
        }
      }).catch(err => {
        console.error('Background insert error:', err);
      });

      console.log('Fire-and-forget request sent. Waiting 1 second before redirect...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true };
    } catch (error: any) {
      console.error('Error preparing booking:', error);
      return { success: false };
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

          await completeBooking(response.razorpay_payment_id);

          console.log('Redirecting to success page...');

          setIsProcessing(false);
          onClose();

          navigate('/booking-success', { replace: true });
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
