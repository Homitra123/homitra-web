import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

interface BookingData {
  serviceId: string;
  serviceName: string;
  tier: string;
  date: string;
  timeSlot: string;
  location: string;
  address: string;
  price: number;
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const bookingData = location.state?.bookingData as BookingData | undefined;

  if (!bookingData) {
    navigate('/');
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalAmount = bookingData.price;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Booking Summary
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Service Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service</p>
                  <p className="text-lg font-semibold text-gray-900">{bookingData.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tier</p>
                  <p className="text-lg font-semibold text-gray-900">{bookingData.tier}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule & Location</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="text-gray-900 font-medium">{formatDate(bookingData.date)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Time Slot</p>
                    <p className="text-gray-900 font-medium">{bookingData.timeSlot}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="text-gray-900 font-medium">{bookingData.location}</p>
                    <p className="text-gray-600 text-sm mt-1">{bookingData.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Price Breakdown</h2>
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charge</span>
                  <span className="font-medium text-gray-900">₹{bookingData.price}</span>
                </div>
              </div>
              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">₹{totalAmount}</span>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
              >
                <CreditCard size={20} />
                <span>Pay & Confirm Booking</span>
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                By confirming, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          amount={totalAmount}
          bookingData={bookingData}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

export default Checkout;
