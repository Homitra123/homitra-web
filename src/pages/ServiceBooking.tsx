import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calendar, MapPin, Check, Plus, X } from 'lucide-react';
import { services } from '../data/mockData';
import { BANGALORE_LOCATIONS, DURATIONS, TIME_PERIODS, TIME_SLOTS } from '../types';

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

const ServiceBooking = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('');
  const [scheduledBookings, setScheduledBookings] = useState<ScheduledBooking[]>([]);
  const [isMultipleBooking, setIsMultipleBooking] = useState<boolean>(false);

  const service = services.find(s => s.id === serviceId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: service?.pricingTiers.length === 1 ? {
      tierId: service.pricingTiers[0].id
    } : undefined
  });

  const watchedTierId = watch('tierId');
  const watchedLocation = watch('location');
  const watchedAddress = watch('address');
  const watchedDate = watch('date');
  const watchedTimeSlot = watch('timeSlot');

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
      year: 'numeric'
    });
  };

  const addBooking = (data: BookingFormData) => {
    const newBooking: ScheduledBooking = {
      id: `${data.date}-${data.timeSlot}-${Date.now()}`,
      date: data.date,
      timeSlot: data.timeSlot,
      displayDate: formatDisplayDate(data.date),
    };

    setScheduledBookings([...scheduledBookings, newBooking]);

    setValue('date', '');
    setValue('timeSlot', '');
    setValue('timePeriod', '');
    setSelectedTimePeriod('');
  };

  const removeBooking = (id: string) => {
    setScheduledBookings(scheduledBookings.filter(b => b.id !== id));
  };

  const isFormValid = () => {
    if (!watchedTierId) return false;
    if (!watchedLocation || !watchedAddress || watchedAddress.length < 10) return false;

    if (isMultipleBooking) {
      return scheduledBookings.length > 0;
    } else {
      return !!(watchedDate && watchedTimeSlot);
    }
  };

  const onSubmit = (data: BookingFormData) => {
    const selectedTierData = service.pricingTiers.find(t => t.id === data.tierId);
    if (!selectedTierData) return;

    if (isMultipleBooking && scheduledBookings.length === 0) {
      return;
    }

    if (!isMultipleBooking && (!data.date || !data.timeSlot || !data.timePeriod)) {
      return;
    }

    const bookingData = {
      serviceId: service.id,
      serviceName: service.name,
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
      price: isMultipleBooking
        ? selectedTierData.price * scheduledBookings.length
        : selectedTierData.price,
      visits: isMultipleBooking ? scheduledBookings.length : 1,
    };

    navigate('/checkout', { state: { bookingData } });
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose your Service</h2>
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

                  {/* Heading Section - Fixed Height */}
                  <div className="h-[72px] mb-4 flex items-start">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">{tier.name}</h3>
                  </div>

                  {/* Description Section - Fixed Height */}
                  <div className="h-[84px] mb-4">
                    {tier.description && (
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">{tier.description}</p>
                    )}
                  </div>

                  {/* Pricing Section - Fixed Height */}
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

                  {/* What's Included Section */}
                  {tier.included && tier.included.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">What's included:</h4>
                      <ul className="space-y-1.5">
                        {tier.included.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check size={10} className="text-white" strokeWidth={3} />
                            </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
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
                <p className="text-lg font-semibold text-blue-600">Starting at ₹{service.pricingTiers[0].price} for the 1st hour</p>
              </div>

              <div className="space-y-6">
                {service.pricingTiers[0].included && service.pricingTiers[0].included.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">What's included:</h4>
                    <ul className="space-y-2">
                      {service.pricingTiers[0].included.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Schedule Your Service</h2>
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
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Calendar size={18} className="text-blue-600" />
                <span>Select Date</span>
              </label>
              <input
                type="date"
                {...register('date', { required: !isMultipleBooking })}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {errors.date && !isMultipleBooking && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {service.id !== 'car-cleaning' && (
              <div>
                <label className="text-base font-semibold text-gray-900 mb-2.5 block">Duration</label>
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
                      <div className="text-sm font-bold leading-tight">
                        ₹{duration.price}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.duration && (
                  <p className="mt-2 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">Start Time</label>

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
                  {TIME_SLOTS[selectedTimePeriod as keyof typeof TIME_SLOTS].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setValue('timeSlot', slot)}
                      className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
                        watch('timeSlot') === slot
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-orange-50 text-gray-800 hover:bg-orange-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Location</h2>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={18} className="text-blue-600" />
                <span>Bangalore Area</span>
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Complete Address
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

        <button
          type="submit"
          disabled={!isFormValid()}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          {isMultipleBooking && scheduledBookings.length > 0
            ? `Continue with ${scheduledBookings.length} Booking${scheduledBookings.length > 1 ? 's' : ''}`
            : 'Continue to Checkout'}
        </button>
      </form>
    </div>
  );
};

export default ServiceBooking;
