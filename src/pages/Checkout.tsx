import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, CreditCard, AlertCircle, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import { useIntroOffer, INTRO_PRICE, INTRO_ELIGIBLE_TIERS, INTRO_ELIGIBLE_COOKING_PLANS } from '../lib/useIntroOffer';
import { PEST_SERVICES, PEST_ADD_ONS, calcPestServicePrice } from '../components/pest/PestServiceSelector';
import type { SelectedPestService } from '../components/pest/PestServiceSelector';

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
  const { profile } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const bookingData = location.state?.bookingData as BookingData | undefined;
  const introOffer = useIntroOffer();

  useEffect(() => {
    if (profile && !profile.phone) {
      setPhoneError(true);
    }
  }, [profile]);

  if (!bookingData) {
    navigate('/');
    return null;
  }

  // Determine if this booking is eligible for intro pricing
  const isEligibleBooking = (() => {
    if (!bookingData) return false;
    const serviceId = bookingData.serviceId;
    const tierId = (bookingData as any).tierId ?? '';
    const bookingMode = (bookingData as any).bookingMode ?? 'single';
    // Car cleaning - Express Exterior Wash, single booking only
    if (serviceId === 'car-cleaning') {
      return INTRO_ELIGIBLE_TIERS.has(tierId) && bookingMode === 'single';
    }
    // Home cooking - eligible plans, single day, ≤2 people, no add-ons
    if (serviceId === 'home-cooking') {
      const details = (bookingData as any).customizerDetails ?? {};
      const plan = details.plan ?? '';
      if (!INTRO_ELIGIBLE_COOKING_PLANS.has(plan)) return false;
      if (bookingMode !== 'single') return false;
      const people = details.people ?? 1;
      if (people > 2) return false;
      // Disqualify if any paid add-ons are selected
      const hasAddOns =
        (details.extraRotisCount ?? 0) > 0 ||
        !!details.addExtraVeg ||
        !!details.addExtraNonVeg;
      if (hasAddOns) return false;
      return true;
    }
    return false;
  })();

  const applyIntroPrice =
    introOffer.isActive && isEligibleBooking && introOffer.slotsRemaining > 0;
  const finalAmount = applyIntroPrice ? INTRO_PRICE : bookingData.price;

  const handleProceedToPayment = () => {
    if (!profile?.phone) {
      setPhoneError(true);
      return;
    }
    setShowPaymentModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalAmount = finalAmount;

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
                {(bookingData as any).serviceId === 'pest-control' && (bookingData as any).pestServices ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Selected Treatments</p>
                    <div className="space-y-1">
                      {((bookingData as any).pestServices as SelectedPestService[]).map((s) => {
                        const svc = PEST_SERVICES.find(p => p.id === s.id)!;
                        return (
                          <p key={s.id} className="text-base font-semibold text-gray-900">{svc.name}</p>
                        );
                      })}
                      {((bookingData as any).pestAddOns as string[]).length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Add-Ons: {((bookingData as any).pestAddOns as string[]).map(id => PEST_ADD_ONS.find(a => a.id === id)?.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tier</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(bookingData as any).bathroomCount
                        ? `${bookingData.tier} · ${(bookingData as any).bathroomCount} Bathroom${(bookingData as any).bathroomCount > 1 ? 's' : ''}`
                        : bookingData.tier}
                    </p>
                  </div>
                )}
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

              {applyIntroPrice && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <Tag size={16} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Introductory Offer Applied!</p>
                    <p className="text-xs text-amber-700">
                      First-time price: ₹{INTRO_PRICE} &nbsp;·&nbsp; {introOffer.slotsRemaining === 2 ? '1 of 2' : '2 of 2'} intro slots used
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                {(bookingData as any).serviceId === 'pest-control' && (bookingData as any).pestServices ? (
                  <>
                    {((bookingData as any).pestServices as SelectedPestService[]).map((s) => {
                      const svc = PEST_SERVICES.find(p => p.id === s.id)!;
                      return (
                        <div key={s.id} className="flex justify-between">
                          <span className="text-gray-600">{svc.name}</span>
                          <span className="font-medium text-gray-900">₹{calcPestServicePrice(svc, s.config).toLocaleString()}</span>
                        </div>
                      );
                    })}
                    {((bookingData as any).pestAddOns as string[]).map((id) => {
                      const ao = PEST_ADD_ONS.find(a => a.id === id)!;
                      return (
                        <div key={id} className="flex justify-between">
                          <span className="text-gray-500 text-sm">{ao.name} <span className="text-xs text-gray-400">(Add-On)</span></span>
                          <span className="font-medium text-gray-900">₹{ao.price}</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Charge</span>
                    {applyIntroPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-gray-400">₹{bookingData.price}</span>
                        <span className="font-bold text-amber-700">₹{INTRO_PRICE}</span>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">₹{bookingData.price}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">₹{totalAmount}</span>
              </div>
              {phoneError && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        Phone Number Required
                      </p>
                      <p className="text-sm text-amber-800 mb-3">
                        Please add your phone number to complete the booking
                      </p>
                      <Link
                        to="/profile"
                        className="inline-block text-sm font-medium text-amber-900 underline hover:text-amber-700"
                      >
                        Go to Profile →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleProceedToPayment}
                disabled={!profile?.phone}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
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
          bookingData={{ ...bookingData, isIntroPriced: applyIntroPrice }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

export default Checkout;
