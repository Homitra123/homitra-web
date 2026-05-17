import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveBookingDraft, getBookingDraft } from '../lib/bookingSession';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calendar, MapPin, Check, Plus, X, AlertCircle, ChevronUp, ChevronDown, Clock, Zap } from 'lucide-react';
import { services } from '../data/mockData';
import { BANGALORE_LOCATIONS, DURATIONS, HOUSEKEEP_DURATIONS, TIME_PERIODS, TIME_SLOTS } from '../types';
import { isTimeSlotDisabled } from '../lib/timeUtils';
import DatePickerInput from '../components/DatePickerInput';
import { useIntroOffer } from '../lib/useIntroOffer';
import { useAuth } from '../context/AuthContext';
import PestServiceSelector, {
  SelectedPestService,
  PEST_ADD_ONS,
  PEST_SERVICES,
  calcPestServicePrice,
} from '../components/pest/PestServiceSelector';

const DURATION_PRICE_MAP: Record<number, number> = Object.fromEntries(
  DURATIONS.map(d => [d.minutes, d.price])
);

const HOUSEKEEP_DURATION_PRICE_MAP: Record<number, number> = Object.fromEntries(
  HOUSEKEEP_DURATIONS.map(d => [d.hours, d.price])
);

interface ScheduledBooking {
  id: string;
  date: string;
  timeSlot: string;
  displayDate: string;
}

const bookingSchema = z.object({
  date: z.string().optional(),
  duration: z.number().optional(),
  timePeriod: z.string().optional(),
  timeSlot: z.string().optional(),
  location: z.string().min(1, 'Please select a location'),
  address: z.string().min(10, 'Please enter a detailed address (minimum 10 characters)'),
  tierId: z.string().min(1, 'Please select a service tier'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const getMinDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const getMaxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const ServiceBooking = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('Morning');
  const [scheduledBookings, setScheduledBookings] = useState<ScheduledBooking[]>([]);
  const [isMultipleBooking, setIsMultipleBooking] = useState<boolean>(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [bathroomCount, setBathroomCount] = useState(1);
  const [selectedPestServices, setSelectedPestServices] = useState<SelectedPestService[]>([]);
  const [selectedPestAddOns, setSelectedPestAddOns] = useState<string[]>([]);

  const service = services.find(s => s.id === serviceId);
  const introOffer = useIntroOffer();
  const { profile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: getMinDate(),
      timePeriod: 'Morning',
      ...(service?.pricingTiers.length === 1 ? { tierId: service.pricingTiers[0].id } : {}),
    },
  });

  const watchedTierId = watch('tierId');
  const watchedLocation = watch('location');
  const watchedAddress = watch('address');
  const watchedDate = watch('date');
  const watchedTimeSlot = watch('timeSlot');

  // Restore draft on mount; fall back to saved profile address when no draft
  useEffect(() => {
    if (!serviceId) return;
    const draft = getBookingDraft(serviceId) as Record<string, any> | null;
    if (draft) {
      if (draft.tierId) { setValue('tierId', draft.tierId); setSelectedTier(draft.tierId); }
      if (draft.date) setValue('date', draft.date);
      if (draft.timeSlot) setValue('timeSlot', draft.timeSlot);
      if (draft.timePeriod) { setValue('timePeriod', draft.timePeriod); setSelectedTimePeriod(draft.timePeriod); }
      if (draft.duration) { setValue('duration', draft.duration); setSelectedDuration(draft.duration); }
      if (draft.location) setValue('location', draft.location);
      if (draft.address) setValue('address', draft.address);
      if (typeof draft.isMultipleBooking === 'boolean') setIsMultipleBooking(draft.isMultipleBooking);
      if (draft.scheduledBookings) setScheduledBookings(draft.scheduledBookings as ScheduledBooking[]);
      if (typeof draft.bathroomCount === 'number') setBathroomCount(draft.bathroomCount);
    } else if (profile) {
      if (profile.location) setValue('location', profile.location);
      if (profile.address) setValue('address', profile.address);
    }
  }, [serviceId, profile?.id]);

  // Auto-select tier if there's only one option
  if (service?.pricingTiers.length === 1 && !selectedTier) {
    setSelectedTier(service.pricingTiers[0].id);
    setValue('tierId', service.pricingTiers[0].id);
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Service not found</p>
        </div>
      </div>
    );
  }

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const addBooking = (data: BookingFormData) => {
    const newBooking: ScheduledBooking = {
      id: `${data.date}-${data.timeSlot}-${Date.now()}`,
      date: data.date ?? '',
      timeSlot: data.timeSlot ?? '',
      displayDate: formatDisplayDate(data.date ?? ''),
    };

    setScheduledBookings([...scheduledBookings, newBooking]);

    setValue('date', getMinDate());
    setValue('timeSlot', '');
    setValue('timePeriod', 'Morning');
    setSelectedTimePeriod('Morning');
  };

  const removeBooking = (id: string) => {
    setScheduledBookings(scheduledBookings.filter(b => b.id !== id));
  };

  const isFormValid = () => {
    if (!watchedTierId) return false;
    if (service?.id === 'pest-control' && selectedPestServices.length === 0) return false;
    if (!watchedLocation || !watchedAddress || watchedAddress.length < 10) return false;

    if (isMultipleBooking) {
      return scheduledBookings.length > 0;
    } else {
      return !!(watchedDate && watchedTimeSlot);
    }
  };

  // Progressive unlock
  const tierSelected = !!watchedTierId;
  const dateSelected = !!watchedDate;
  const timeSelected = !!watchedTimeSlot || (isMultipleBooking && scheduledBookings.length > 0);
  const scheduleUnlocked = tierSelected;
  const timePeriodUnlocked = tierSelected && dateSelected;
  const locationUnlocked = tierSelected && dateSelected && (isMultipleBooking ? scheduledBookings.length > 0 : !!watchedTimeSlot);

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!watchedTierId) missing.push('Service tier not selected');
    if (service?.id === 'pest-control' && selectedPestServices.length === 0) missing.push('Select at least one treatment');
    if (isMultipleBooking) {
      if (scheduledBookings.length === 0) missing.push('No bookings added');
    } else {
      if (!watchedDate) missing.push('Date not selected');
      if (!watchedTimeSlot) missing.push('Start time not selected');
    }
    if (!watchedLocation) missing.push('Service area not selected');
    if (!watchedAddress || watchedAddress.length < 10) missing.push('Complete address not provided');
    return missing;
  };

  const getPestServicesTotal = (): number => {
    return selectedPestServices.reduce((sum, s) => {
      const svc = PEST_SERVICES.find(p => p.id === s.id)!;
      return sum + calcPestServicePrice(svc, s.config);
    }, 0);
  };

  const getPestAddOnsTotal = (): number => {
    return selectedPestAddOns.reduce((sum, id) => {
      const ao = PEST_ADD_ONS.find(a => a.id === id);
      return sum + (ao?.price ?? 0);
    }, 0);
  };

  const getUnitPrice = (): number => {
    if (service.id === 'pest-control') {
      return getPestServicesTotal() + getPestAddOnsTotal();
    }
    const selectedTierData = service.pricingTiers.find(t => t.id === watchedTierId);
    if (!selectedTierData) return 0;
    const noDuration = ['car-cleaning', 'pest-control', 'deep-bathroom-cleaning'].includes(service.id);
    const watchedDuration = watch('duration');
    if (service.id === 'deep-bathroom-cleaning') {
      return selectedTierData.price * bathroomCount;
    }
    if (!noDuration && watchedDuration) {
      if (service.id === 'premier-housekeep') {
        return HOUSEKEEP_DURATION_PRICE_MAP[watchedDuration] ?? selectedTierData.price;
      }
      return DURATION_PRICE_MAP[watchedDuration] ?? selectedTierData.price;
    }
    return selectedTierData.price;
  };

  const getTotalPrice = (): number => {
    const unit = getUnitPrice();
    if (isMultipleBooking) return unit * scheduledBookings.length;
    return unit;
  };

  const getServiceSummary = (): string => {
    const selectedTierData = service.pricingTiers.find(t => t.id === watchedTierId);
    if (!selectedTierData) return service.name;
    const watchedDuration = watch('duration');
    const parts = [selectedTierData.name];
    if (service.id === 'deep-bathroom-cleaning') {
      parts.push(`${bathroomCount} Bathroom${bathroomCount > 1 ? 's' : ''}`);
    } else if (watchedDuration) {
      parts.push(`${watchedDuration} Mins`);
    }
    if (isMultipleBooking && scheduledBookings.length > 0) {
      parts.push(`${scheduledBookings.length} Booking${scheduledBookings.length > 1 ? 's' : ''}`);
    }
    return parts.join(' · ');
  };

  const onSubmit = (data: BookingFormData) => {
    const selectedTierData = service.pricingTiers.find(t => t.id === data.tierId);
    if (!selectedTierData) return;

    if (isMultipleBooking && scheduledBookings.length === 0) return;
    if (!isMultipleBooking && (!data.date || !data.timeSlot)) return;

    const pestServicesTotal = service.id === 'pest-control' ? getPestServicesTotal() : 0;
    const pestAddOnsTotal = service.id === 'pest-control' ? getPestAddOnsTotal() : 0;

    const bookingData = {
      serviceId: service.id,
      serviceName: service.name,
      tierId: data.tierId,
      tier: selectedTierData.name,
      bookingMode: isMultipleBooking ? 'multiple' : 'single',
      duration: data.duration ? `${data.duration} min` : '1 hour',
      date: isMultipleBooking ? scheduledBookings[0].date : data.date,
      dates: isMultipleBooking ? scheduledBookings.map(b => b.date) : [data.date],
      weekdays: [],
      timeSlot: isMultipleBooking ? scheduledBookings[0].timeSlot : data.timeSlot,
      flexibleBookings: isMultipleBooking ? scheduledBookings : null,
      location: data.location,
      address: data.address,
      price: (() => {
        if (service.id === 'pest-control') {
          const total = pestServicesTotal + pestAddOnsTotal;
          return isMultipleBooking ? total * scheduledBookings.length : total;
        }
        const noDuration = ['car-cleaning', 'deep-bathroom-cleaning'].includes(service.id);
        let unitPrice = selectedTierData.price;
        if (service.id === 'deep-bathroom-cleaning') {
          unitPrice = selectedTierData.price * bathroomCount;
        } else if (!noDuration && data.duration) {
          if (service.id === 'premier-housekeep') {
            unitPrice = HOUSEKEEP_DURATION_PRICE_MAP[data.duration] ?? selectedTierData.price;
          } else {
            unitPrice = DURATION_PRICE_MAP[data.duration] ?? selectedTierData.price;
          }
        }
        return isMultipleBooking ? unitPrice * scheduledBookings.length : unitPrice;
      })(),
      bathroomCount: service.id === 'deep-bathroom-cleaning' ? bathroomCount : undefined,
      visits: isMultipleBooking ? scheduledBookings.length : 1,
      pestServices: service.id === 'pest-control' ? selectedPestServices : undefined,
      pestAddOns: service.id === 'pest-control' ? selectedPestAddOns : undefined,
      pestServicesTotal: service.id === 'pest-control' ? pestServicesTotal : undefined,
      pestAddOnsTotal: service.id === 'pest-control' ? pestAddOnsTotal : undefined,
    };

    // Save draft so back button from checkout restores all selections
    if (serviceId) {
      saveBookingDraft(serviceId, {
        tierId: data.tierId,
        date: isMultipleBooking ? scheduledBookings[0]?.date ?? data.date : data.date,
        timeSlot: isMultipleBooking ? scheduledBookings[0]?.timeSlot ?? '' : data.timeSlot ?? '',
        timePeriod: data.timePeriod ?? selectedTimePeriod,
        duration: data.duration ?? selectedDuration,
        location: data.location,
        address: data.address,
        isMultipleBooking,
        scheduledBookings,
        ...(service.id === 'deep-bathroom-cleaning' ? { bathroomCount } : {}),
      });
    }
    navigate('/checkout', { state: { bookingData } });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-40 md:pb-36">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-3">
          {service.name}
        </h1>
        <p className="text-gray-600 text-lg">
          {service.description}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {service.pricingTiers.length > 1 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Choose your Service <span className="text-red-500 font-bold">*</span>
            </h2>
            <div className={`grid grid-cols-1 gap-4 ${
              service.pricingTiers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
            }`}>
              {service.pricingTiers.map((tier) => (
                <label
                  key={tier.id}
                  className={`relative cursor-pointer rounded-xl border-[4px] p-6 transition-all flex flex-col ${
                    watchedTierId === tier.id
                      ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                      : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <input
                    type="radio"
                    value={tier.id}
                    {...register('tierId')}
                    className="sr-only"
                    onChange={(e) => {
                      setValue('tierId', e.target.value);
                      setSelectedTier(e.target.value);
                    }}
                  />
                  {watchedTierId === tier.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check size={16} className="text-white" strokeWidth={3} />
                    </div>
                  )}

                  {introOffer.isActive && introOffer.slotsRemaining > 0 && introOffer.isEligibleTier(tier.id) && !isMultipleBooking && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 intro-badge-glow text-amber-950 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      <Zap size={10} className="fill-amber-950" strokeWidth={0} />
                      ₹99 Intro Price
                    </div>
                  )}

                  <div className={`h-[72px] mb-4 flex items-start ${introOffer.isActive && introOffer.slotsRemaining > 0 && introOffer.isEligibleTier(tier.id) && !isMultipleBooking ? 'pt-7' : ''}`}>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">{tier.name}</h3>
                  </div>

                  <div className="h-[84px] mb-4">
                    {tier.description && (
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">{tier.description}</p>
                    )}
                  </div>

                  <div className="h-[44px] mb-4 flex items-center">
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">₹{tier.price}</p>
                      {tier.duration && (
                        <>
                          <span className="text-gray-300">|</span>
                          <p className="text-sm font-semibold text-gray-600">{tier.duration}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {(tier.includedGroups || (tier.included && tier.included.length > 0)) && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">What's included:</h4>
                      {tier.includedGroups ? (
                        <div className="space-y-3">
                          {tier.includedGroups.map((group, gi) => (
                            <div key={gi}>
                              <p className="text-xs font-bold text-gray-800 mb-1.5">{group.heading}</p>
                              <ul className="space-y-1.5 pl-1">
                                {group.items.map((item, ii) => (
                                  <li key={ii} className="flex items-start gap-2 text-xs text-gray-600">
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <Check size={10} className="text-white" strokeWidth={3} />
                                    </div>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-1.5">
                          {tier.included!.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check size={10} className="text-white" strokeWidth={3} />
                              </div>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {tier.notIncluded && tier.notIncluded.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">What's not included:</h4>
                      <ul className="space-y-1.5">
                        {tier.notIncluded.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-[10px] font-bold">✕</span>
                            </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </label>
              ))}
            </div>
            {errors.tierId && (
              <p className="mt-2 text-sm text-red-600">{errors.tierId.message}</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="border-[4px] border-gray-300 rounded-xl p-6 bg-gray-50">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Service Offerings</h3>
                {service.id !== 'pest-control' && (
                  <p className="text-lg font-semibold text-blue-600">
                    {service.id === 'deep-bathroom-cleaning'
                      ? `₹${service.pricingTiers[0].price} per bathroom · ${service.pricingTiers[0].duration}`
                      : service.id === 'premier-housekeep'
                      ? `Starting at ₹${HOUSEKEEP_DURATIONS[0].price} for ${HOUSEKEEP_DURATIONS[0].label}`
                      : `Starting at ₹${service.pricingTiers[0].price} for the 1st hour`}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {(service.pricingTiers[0].includedGroups || (service.pricingTiers[0].included && service.pricingTiers[0].included.length > 0)) && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">What's included:</h4>
                    {service.pricingTiers[0].includedGroups ? (
                      <div className="space-y-4">
                        {service.pricingTiers[0].includedGroups.map((group, gi) => (
                          <div key={gi}>
                            <p className="text-sm font-bold text-gray-900 mb-2">{group.heading}</p>
                            <ul className="space-y-2 pl-1">
                              {group.items.map((item, ii) => (
                                <li key={ii} className="flex items-start gap-2.5 text-sm text-gray-700">
                                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check size={12} className="text-white" strokeWidth={3} />
                                  </div>
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {service.pricingTiers[0].included!.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check size={12} className="text-white" strokeWidth={3} />
                            </div>
                            <span className="leading-relaxed">
                              {item.includes(':') ? (
                                <><strong className="font-bold text-gray-900">{item.split(':')[0]}:</strong>{item.slice(item.indexOf(':') + 1)}</>
                              ) : item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {service.pricingTiers[0].notIncluded && service.pricingTiers[0].notIncluded.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">What's not included:</h4>
                    <ul className="space-y-2">
                      {service.pricingTiers[0].notIncluded.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-[11px] font-bold">✕</span>
                          </div>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pest service selector — pest-control only */}
        {service.id === 'pest-control' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <PestServiceSelector
              selectedServices={selectedPestServices}
              selectedAddOns={selectedPestAddOns}
              onServicesChange={setSelectedPestServices}
              onAddOnsChange={setSelectedPestAddOns}
            />
            {hasAttemptedSubmit && selectedPestServices.length === 0 && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                Please select at least one treatment to continue.
              </p>
            )}
          </div>
        )}

        {/* Bathroom count selector — deep bathroom cleaning only */}
        {service.id === 'deep-bathroom-cleaning' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Number of Bathrooms</h2>
            <p className="text-sm text-gray-500 mb-6">₹499 per bathroom · Approx. 45 mins each</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setBathroomCount(c => Math.max(1, c - 1))}
                className="w-11 h-11 rounded-full border-2 border-orange-400 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-2xl font-bold leading-none"
                disabled={bathroomCount <= 1}
              >
                −
              </button>
              <div className="text-center min-w-[64px]">
                <div className="text-4xl font-bold text-gray-900">{bathroomCount}</div>
                <div className="text-sm text-gray-500 mt-0.5">{bathroomCount === 1 ? 'bathroom' : 'bathrooms'}</div>
              </div>
              <button
                type="button"
                onClick={() => setBathroomCount(c => Math.min(10, c + 1))}
                className="w-11 h-11 rounded-full border-2 border-orange-400 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-2xl font-bold leading-none"
                disabled={bathroomCount >= 10}
              >
                +
              </button>
              <div className="ml-4 px-4 py-2 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-xs text-gray-500 font-medium">Subtotal</div>
                <div className="text-lg font-bold text-orange-600">₹{(bathroomCount * 499).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule section */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 transition-opacity duration-200 ${!scheduleUnlocked ? 'opacity-50 pointer-events-none' : ''}`}>
          {!scheduleUnlocked && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mb-4">
              <AlertCircle size={13} />
              Select a service tier above first
            </p>
          )}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Schedule Your Service
            </h2>
            <label className="flex items-center space-x-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Multiple Bookings</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isMultipleBooking}
                  onChange={(e) => {
                    setIsMultipleBooking(e.target.checked);
                    setScheduledBookings([]);
                  }}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  isMultipleBooking ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isMultipleBooking ? 'transform translate-x-5' : ''
                  }`} />
                </div>
              </div>
            </label>
          </div>

          {isMultipleBooking && scheduledBookings.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Scheduled Bookings ({scheduledBookings.length})
              </h3>
              <div className="space-y-2">
                {scheduledBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{booking.displayDate}</p>
                        <p className="text-xs text-gray-600">{booking.timeSlot}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBooking(booking.id)}
                      className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X size={18} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-800 mb-3">
                <Calendar size={18} className="text-blue-600" />
                <span>Select Date <span className="text-red-500 font-bold">*</span></span>
              </label>
              <input type="hidden" {...register('date', { required: !isMultipleBooking })} />
              <DatePickerInput
                value={watchedDate ?? ''}
                onChange={(d) => {
                  setValue('date', d, { shouldValidate: true });
                  setValue('timeSlot', '');
                  setValue('timePeriod', 'Morning');
                  setSelectedTimePeriod('Morning');
                }}
                minDate={getMinDate()}
                maxDate={getMaxDate()}
              />
              {errors.date && !isMultipleBooking && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {!['car-cleaning', 'pest-control', 'deep-bathroom-cleaning'].includes(service.id) && (
              <div>
                <label className="text-base font-semibold text-gray-900 mb-2.5 block">Duration</label>
                {service.id === 'premier-housekeep' ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {HOUSEKEEP_DURATIONS.map((duration) => (
                      <button
                        key={duration.hours}
                        type="button"
                        onClick={() => {
                          setSelectedDuration(duration.hours);
                          setValue('duration', duration.hours);
                        }}
                        className={`relative px-3 py-3 rounded-xl border-2 transition-all ${
                          selectedDuration === duration.hours
                            ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                            : 'bg-white border-orange-400 text-gray-900 hover:border-orange-500 hover:bg-orange-50'
                        }`}
                      >
                        <div className="text-base font-bold leading-tight mb-0.5">{duration.label}</div>
                        <div className="text-sm font-bold leading-tight">₹{duration.price}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {DURATIONS.map((duration) => (
                      <button
                        key={duration.minutes}
                        type="button"
                        onClick={() => {
                          setSelectedDuration(duration.minutes);
                          setValue('duration', duration.minutes);
                        }}
                        className={`relative px-3 py-3 rounded-xl border-2 transition-all ${
                          selectedDuration === duration.minutes
                            ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                            : 'bg-white border-orange-400 text-gray-900 hover:border-orange-500 hover:bg-orange-50'
                        }`}
                      >
                        <div className="text-base font-bold leading-tight mb-0.5">{duration.label}</div>
                        <div className="text-sm font-bold leading-tight">₹{duration.price}</div>
                      </button>
                    ))}
                  </div>
                )}
                {errors.duration && (
                  <p className="mt-2 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>
            )}

            {/* Time period — only enabled once date is selected */}
            <div className={`transition-opacity duration-200 ${!timePeriodUnlocked ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-base font-bold text-gray-900 mb-1 block">
                Start Time <span className="text-red-500 font-bold">*</span>
              </label>
              {!timePeriodUnlocked && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mb-2">
                  <AlertCircle size={13} />
                  Select a date above first
                </p>
              )}

              <div className="grid grid-cols-3 gap-3 mb-3">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      setSelectedTimePeriod(period);
                      setValue('timePeriod', period);
                      setValue('timeSlot', '');
                    }}
                    className={`py-3 px-4 rounded-xl text-base font-medium transition-all ${
                      selectedTimePeriod === period
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-orange-50 text-gray-700 hover:bg-orange-100'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {selectedTimePeriod && (
                <div className="grid grid-cols-4 gap-2.5">
                  {TIME_SLOTS[selectedTimePeriod as keyof typeof TIME_SLOTS].map((slot) => {
                    const disabled = isTimeSlotDisabled(slot, watchedDate);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setValue('timeSlot', slot)}
                        className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
                          disabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : watch('timeSlot') === slot
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-orange-50 text-gray-800 hover:bg-orange-100'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}

              {errors.timePeriod && !isMultipleBooking && (
                <p className="mt-2 text-sm text-red-600">{errors.timePeriod.message}</p>
              )}
              {errors.timeSlot && !isMultipleBooking && (
                <p className="mt-2 text-sm text-red-600">{errors.timeSlot.message}</p>
              )}
            </div>

            {isMultipleBooking && (
              <button
                type="button"
                onClick={() => {
                  const date = watch('date');
                  const timeSlot = watch('timeSlot');
                  if (date && timeSlot) {
                    addBooking({ ...watch() } as BookingFormData);
                  }
                }}
                disabled={!watch('date') || !watch('timeSlot')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-500"
              >
                <Plus size={20} />
                Add Booking
              </button>
            )}
          </div>
        </div>

        {/* Service Location — only enabled once date + time selected */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 transition-opacity duration-200 ${!locationUnlocked ? 'opacity-50 pointer-events-none' : ''}`}>
          {!locationUnlocked && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mb-4">
              <AlertCircle size={13} />
              {!tierSelected ? 'Select a service tier first' : !dateSelected ? 'Select a date first' : 'Select a start time first'}
            </p>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Location</h2>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-800 mb-2">
                <MapPin size={18} className="text-blue-600" />
                <span>Bangalore Area <span className="text-red-500 font-bold">*</span></span>
              </label>
              <select
                {...register('location')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select your area</option>
                {BANGALORE_LOCATIONS.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-gray-800 mb-2 block">
                Complete Address <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                {...register('address')}
                rows={3}
                placeholder="House/Flat number, Building name, Street, Landmark..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="h-2" />
      </form>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <button
            onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
            className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
              <Clock size={15} className="text-orange-500 flex-shrink-0" />
              <span className="font-medium truncate">
                {watchedTierId ? getServiceSummary() : service.name}
              </span>
            </div>
            {showPriceBreakdown ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronUp size={16} className="flex-shrink-0" />}
          </button>

          {showPriceBreakdown && getTotalPrice() > 0 && (
            <div className="pb-3 text-sm border-t border-gray-100 pt-2 space-y-1">
              {service.id === 'pest-control' ? (
                <>
                  {selectedPestServices.map((s) => {
                    const svc = PEST_SERVICES.find(p => p.id === s.id)!;
                    return (
                      <div key={s.id} className="flex justify-between text-gray-600">
                        <span>{svc.name}</span>
                        <span className="font-semibold text-gray-900">₹{calcPestServicePrice(svc, s.config).toLocaleString()}</span>
                      </div>
                    );
                  })}
                  {selectedPestAddOns.map((id) => {
                    const ao = PEST_ADD_ONS.find(a => a.id === id)!;
                    return (
                      <div key={id} className="flex justify-between text-gray-600">
                        <span>{ao.name} <span className="text-xs text-gray-400">(Add-On)</span></span>
                        <span className="font-semibold text-gray-900">₹{ao.price}</span>
                      </div>
                    );
                  })}
                </>
              ) : isMultipleBooking && scheduledBookings.length > 0 ? (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Per Visit</span>
                    <span className="font-semibold text-gray-900">₹{getUnitPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{scheduledBookings.length} Visit{scheduledBookings.length > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-gray-900">₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-gray-600">
                  <span>Service Total</span>
                  <span className="font-semibold text-gray-900">₹{getTotalPrice().toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {!isFormValid() && getMissingFields().length > 0 && (
            <div className="pb-2 border-t border-red-100 pt-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {getMissingFields().map((field, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertCircle size={11} />
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 font-medium">Total</div>
              <div className="text-xl font-bold text-orange-600">
                {getTotalPrice() > 0 ? `₹${getTotalPrice().toLocaleString()}` : '—'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isFormValid()) {
                  setHasAttemptedSubmit(true);
                  return;
                }
                handleSubmit(onSubmit)();
              }}
              className={`flex-1 max-w-xs font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                isFormValid()
                  ? 'bg-gray-900 hover:bg-gray-800 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Proceed to Pay</span>
              <span className="text-base">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;
