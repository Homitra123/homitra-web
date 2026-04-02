import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  amount: number;
  bookingData: any;
  onClose: () => void;
}

const PaymentModal = ({ amount, bookingData, onClose }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!user || !profile) {
      setError('You must be logged in to complete booking');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('bookings').insert({
        user_id: user.id,
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
        price: bookingData.price,
        visits: bookingData.visits || 1,
        status: 'confirmed',
      });

      if (insertError) {
        throw insertError;
      }

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/bookings', { state: { showSuccess: true } });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-600" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your booking has been confirmed</p>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              You'll receive a confirmation shortly
            </p>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
                disabled={isProcessing}
              >
                <Smartphone size={20} />
                <span className="font-medium">UPI</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
                disabled={isProcessing}
              >
                <CreditCard size={20} />
                <span className="font-medium">Card</span>
              </button>
            </div>
          </div>

          {paymentMethod === 'upi' && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                UPI ID
              </label>
              <input
                type="text"
                placeholder="yourname@upi"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="priya@paytm"
                disabled={isProcessing}
              />
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="4111 1111 1111 1111"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Expiry
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="12/26"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="123"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <span>Pay ₹{amount}</span>
            )}
          </button>

          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Secured by Homitra Pay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
