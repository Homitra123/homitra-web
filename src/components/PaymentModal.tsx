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
    console.log('=== SAVING BOOKING TO DATABASE ===');
    console.log('Step 1: Validating payment ID:', razorpayPaymentId);

    if (!razorpayPaymentId) {
      console.error('✗ No payment ID provided');
      throw new Error('Payment ID is missing');
    }

    console.log('Step 2: Checking user authentication');
    if (!user?.id) {
      console.error('✗ User not authenticated, user:', user);
      throw new Error('User not authenticated');
    }
    console.log('✓ User authenticated:', user.id);

    console.log('Step 3: Validating booking data');
    console.log('Booking data received:', JSON.stringify(bookingData, null, 2));

    if (!bookingData.date || !bookingData.timeSlot || !bookingData.location) {
      console.error('✗ Missing required fields:', {
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        location: bookingData.location
      });
      throw new Error('Missing required booking information');
    }
    console.log('✓ All required fields present');

    console.log('Step 4: Preparing booking record');
    const bookingRecord = {
      user_id: user.id,
      service_id: bookingData.serviceId || 'unknown',
      service_name: bookingData.serviceName,
      tier: bookingData.tier || 'Standard',
      booking_mode: bookingData.bookingMode || 'single',
      duration: bookingData.duration || '1 hour',
      date: bookingData.date,
      dates: bookingData.dates || [bookingData.date],
      weekdays: bookingData.weekdays || [],
      time_slot: bookingData.timeSlot,
      flexible_bookings: bookingData.flexibleBookings || null,
      location: bookingData.location,
      address: bookingData.address || bookingData.location,
      price: amount,
      visits: bookingData.visits || 1,
      status: 'confirmed',
      payment_id: razorpayPaymentId,
    };

    console.log('Step 5: Inserting booking into database');
    console.log('Booking record:', JSON.stringify(bookingRecord, null, 2));

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingRecord)
        .select()
        .single();

      if (error) {
        console.error('✗ Database error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.error('✗ No data returned from insert');
        throw new Error('No booking data returned from database');
      }

      console.log('✓ Booking saved successfully!');
      console.log('Booking ID:', data.id);
      console.log('Booking data:', data);

      return { success: true, bookingId: data.id };
    } catch (error: any) {
      console.error('✗ Exception during database operation:', error);
      throw error;
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
        handler: function (response: any) {
          console.log('=== PAYMENT SUCCESSFUL ===');
          console.log('Payment response:', response);
          console.log('Razorpay Payment ID:', response.razorpay_payment_id);

          completeBooking(response.razorpay_payment_id)
            .then((result) => {
              console.log('✓ Booking completed successfully, result:', result);
              console.log('✓ Booking ID:', result.bookingId);
              console.log('✓ Starting navigation sequence...');

              setIsProcessing(false);

              console.log('✓ NAVIGATING NOW to /booking-success with ID:', result.bookingId);
              navigate('/booking-success', {
                replace: true,
                state: { bookingId: result.bookingId }
              });

              setTimeout(() => {
                console.log('✓ Closing modal after navigation...');
                onClose();
              }, 100);
            })
            .catch((error: any) => {
              console.error('✗ Failed to complete booking:', error);
              console.error('✗ Error details:', error.message);
              setError('Payment successful but booking failed to save. Please contact support with payment ID: ' + response.razorpay_payment_id);
              setIsProcessing(false);
            });
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
