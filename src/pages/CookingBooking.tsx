import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, ChefHat, Check, MapPin } from 'lucide-react';
import { services } from '../data/mockData';
import { TIME_SLOTS as GLOBAL_TIME_SLOTS, BANGALORE_LOCATIONS } from '../types';

type BookingMode = 'single' | 'multiple' | 'custom' | 'flexible';
type TimeCategory = 'morning' | 'afternoon' | 'evening';

interface DurationOption {
  minutes: number;
  label: string;
  singlePrice: number;
  multiplePrice: number;
  customPrice: number;
}

interface SelectedDate {
  date: Date;
  formatted: string;
}

interface FlexibleBooking {
  id: string;
  date: Date;
  formatted: string;
  timeSlot: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { minutes: 60, label: '60 min', singlePrice: 199, multiplePrice: 796, customPrice: 597 },
  { minutes: 90, label: '90 min', singlePrice: 249, multiplePrice: 996, customPrice: 747 },
  { minutes: 120, label: '2 hrs', singlePrice: 299, multiplePrice: 1196, customPrice: 897 },
  { minutes: 150, label: '2.5 hrs', singlePrice: 349, multiplePrice: 1396, customPrice: 1047 },
];

const TIME_SLOTS = {
  morning: GLOBAL_TIME_SLOTS.Morning,
  afternoon: GLOBAL_TIME_SLOTS.Afternoon,
  evening: GLOBAL_TIME_SLOTS.Evening,
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CookingBooking = () => {
  const navigate = useNavigate();
  const service = services.find(s => s.id === 'home-cooking');

  const [selectedTier, setSelectedTier] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<BookingMode>('single');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[0]);
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<TimeCategory>('evening');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [startDate, setStartDate] = useState<SelectedDate | null>(null);
  const [endDate, setEndDate] = useState<SelectedDate | null>(null);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [showMoreSlots, setShowMoreSlots] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [flexibleBookings, setFlexibleBookings] = useState<FlexibleBooking[]>([]);
  const [tempFlexibleDate, setTempFlexibleDate] = useState<SelectedDate | null>(null);
  const [tempFlexibleTime, setTempFlexibleTime] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Service not found</p>
        </div>
      </div>
    );
  }

  const getCurrentPrice = () => {
    const visitCount = getVisitCount();
    switch (bookingMode) {
      case 'single':
        return selectedDuration.singlePrice;
      case 'multiple':
        return selectedDuration.singlePrice * visitCount;
      case 'custom':
        return selectedDuration.singlePrice * visitCount;
    }
  };

  const getOriginalPrice = () => {
    return Math.round(getCurrentPrice() * 1.5);
  };

  const getVisitCount = () => {
    if (bookingMode === 'single') return 1;
    if (bookingMode === 'multiple') return selectedDates.length;
    if (bookingMode === 'custom') return selectedDates.length;
    if (bookingMode === 'flexible') return flexibleBookings.length;
    return 0;
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const days: Date[] = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDateDisplay = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, month };
  };

  const isDateSelected = (date: Date) => {
    const formatted = formatDate(date);
    if (bookingMode === 'single') {
      return selectedDate?.formatted === formatted;
    }
    return selectedDates.some(d => d.formatted === formatted);
  };

  const isDateInRange = (date: Date) => {
    if ((bookingMode !== 'multiple' && bookingMode !== 'custom') || !startDate || !endDate) return false;
    return date >= startDate.date && date <= endDate.date;
  };

  const matchesSelectedWeekdays = (date: Date) => {
    if (bookingMode !== 'custom' || selectedWeekdays.length === 0) return false;
    const dayOfWeek = date.getDay();
    const mappedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return selectedWeekdays.includes(mappedDay);
  };

  const generateDateRange = (start: Date, end: Date, filterByWeekdays: boolean = false): SelectedDate[] => {
    const dates: SelectedDate[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const shouldInclude = !filterByWeekdays || matchesSelectedWeekdays(currentDate);
      if (shouldInclude) {
        dates.push({
          date: new Date(currentDate),
          formatted: formatDate(currentDate)
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleDateClick = (date: Date) => {
    const formatted = formatDate(date);

    if (bookingMode === 'single') {
      setSelectedDate({ date, formatted });
    } else if (bookingMode === 'multiple') {
      if (!startDate) {
        setStartDate({ date, formatted });
        setEndDate(null);
        setSelectedDates([{ date, formatted }]);
      } else if (!endDate) {
        if (formatted === startDate.formatted) {
          return;
        }
        if (date < startDate.date) {
          setStartDate({ date, formatted });
          setEndDate(startDate);
          setSelectedDates(generateDateRange(date, startDate.date));
        } else {
          setEndDate({ date, formatted });
          setSelectedDates(generateDateRange(startDate.date, date));
        }
      } else {
        setStartDate({ date, formatted });
        setEndDate(null);
        setSelectedDates([{ date, formatted }]);
      }
    } else if (bookingMode === 'custom') {
      if (selectedWeekdays.length === 0) return;

      if (!startDate) {
        setStartDate({ date, formatted });
        setEndDate(null);
        setSelectedDates([]);
      } else if (!endDate) {
        if (formatted === startDate.formatted) {
          return;
        }
        if (date < startDate.date) {
          setStartDate({ date, formatted });
          setEndDate(startDate);
          setSelectedDates(generateDateRange(date, startDate.date, true));
        } else {
          setEndDate({ date, formatted });
          setSelectedDates(generateDateRange(startDate.date, date, true));
        }
      } else {
        setStartDate({ date, formatted });
        setEndDate(null);
        setSelectedDates([]);
      }
    }
  };

  const toggleWeekday = (index: number) => {
    if (selectedWeekdays.includes(index)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== index));
    } else {
      setSelectedWeekdays([...selectedWeekdays, index]);
    }
    setStartDate(null);
    setEndDate(null);
    setSelectedDates([]);
  };

  const handleModeChange = (mode: BookingMode) => {
    setBookingMode(mode);
    setSelectedDate(null);
    setSelectedDates([]);
    setStartDate(null);
    setEndDate(null);
    setSelectedWeekdays([]);
    setFlexibleBookings([]);
    setTempFlexibleDate(null);
    setTempFlexibleTime('');
  };

  const handleFlexibleDateClick = (date: Date) => {
    const formatted = formatDate(date);
    setTempFlexibleDate({ date, formatted });
    setTempFlexibleTime('');
  };

  const addFlexibleBooking = () => {
    if (!tempFlexibleDate || !tempFlexibleTime) return;

    const newBooking: FlexibleBooking = {
      id: `${tempFlexibleDate.formatted}-${tempFlexibleTime}-${Date.now()}`,
      date: tempFlexibleDate.date,
      formatted: tempFlexibleDate.formatted,
      timeSlot: tempFlexibleTime,
    };

    setFlexibleBookings([...flexibleBookings, newBooking]);
    setTempFlexibleDate(null);
    setTempFlexibleTime('');
  };

  const removeFlexibleBooking = (id: string) => {
    setFlexibleBookings(flexibleBookings.filter(b => b.id !== id));
  };

  const isDateInFlexibleBookings = (date: Date) => {
    const formatted = formatDate(date);
    return flexibleBookings.some(b => b.formatted === formatted);
  };

  const getVisibleTimeSlots = () => {
    const slots = TIME_SLOTS[selectedTimeCategory];
    return showMoreSlots ? slots : slots.slice(0, 12);
  };

  const isFormValid = () => {
    if (!selectedTier) return false;
    if (!selectedLocation || !address.trim()) return false;

    if (bookingMode === 'flexible') {
      return flexibleBookings.length > 0;
    } else {
      if (!selectedTimeSlot) return false;
      if (bookingMode === 'single') {
        return selectedDate !== null;
      }
      if (bookingMode === 'multiple' || bookingMode === 'custom') {
        return selectedDates.length > 0;
      }
    }

    return true;
  };

  const handleCheckout = () => {
    if (!isFormValid()) return;

    const visitCount = getVisitCount();
    const bookingData = {
      serviceId: service.id,
      serviceName: service.name,
      tier: service.pricingTiers.find(t => t.id === selectedTier)?.name,
      bookingMode,
      duration: selectedDuration.label,
      date: selectedDate?.formatted || selectedDates[0]?.formatted || flexibleBookings[0]?.formatted,
      dates: bookingMode === 'flexible'
        ? flexibleBookings.map(b => b.formatted)
        : selectedDates.map(d => d.formatted),
      weekdays: selectedWeekdays,
      timeSlot: selectedTimeSlot,
      flexibleBookings: bookingMode === 'flexible' ? flexibleBookings : undefined,
      location: selectedLocation,
      address: address,
      price: getCurrentPrice(),
      visits: visitCount,
    };

    navigate('/checkout', { state: { bookingData } });
  };

  const calendarDays = generateCalendarDays();
  const groupedByMonth = calendarDays.reduce((acc, date) => {
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(date);
    return acc;
  }, {} as Record<string, Date[]>);

  const generateWeekAlignedCalendar = () => {
    const today = new Date();
    const calendarData: { month: string; weeks: (Date | null)[][] }[] = [];

    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 60);

    let currentMonth = startDate.getMonth();
    let monthWeeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    const firstDayOfWeek = startDate.getDay();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    for (let i = 0; i < offset; i++) {
      currentWeek.push(null);
    }

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (currentDate.getMonth() !== currentMonth) {
        if (currentWeek.length > 0) {
          while (currentWeek.length < 7) {
            currentWeek.push(null);
          }
          monthWeeks.push(currentWeek);
        }

        calendarData.push({
          month: new Date(currentDate.getFullYear(), currentMonth).toLocaleDateString('en-US', { month: 'long' }),
          weeks: monthWeeks
        });

        currentMonth = currentDate.getMonth();
        monthWeeks = [];
        currentWeek = [];

        const dayOfWeek = currentDate.getDay();
        const monthOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        for (let i = 0; i < monthOffset; i++) {
          currentWeek.push(null);
        }
      }

      currentWeek.push(new Date(currentDate));

      if (currentWeek.length === 7) {
        monthWeeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      monthWeeks.push(currentWeek);
    }

    if (monthWeeks.length > 0) {
      calendarData.push({
        month: new Date(currentDate.getFullYear(), currentMonth).toLocaleDateString('en-US', { month: 'long' }),
        weeks: monthWeeks
      });
    }

    return calendarData;
  };

  const weekAlignedCalendar = generateWeekAlignedCalendar();

  const handleBack = () => {
    if (selectedTier) {
      setSelectedTier('');
      setBookingMode('single');
      setSelectedDate(null);
      setSelectedDates([]);
      setStartDate(null);
      setEndDate(null);
      setSelectedWeekdays([]);
      setSelectedTimeSlot('');
      setShowBreakdown(false);
      setFlexibleBookings([]);
      setTempFlexibleDate(null);
      setTempFlexibleTime('');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-32">
        <button
          onClick={handleBack}
          className="group flex items-center space-x-2 text-gray-700 hover:text-gray-900 mb-6 transition-all duration-200"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ChefHat className="text-orange-600" size={28} />
            <h1 className="text-2xl md:text-3xl font-bold text-orange-600">
              Schedule Your Chef
            </h1>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg px-3 py-2 inline-flex items-center gap-2 border border-orange-200">
            <MapPin size={16} className="text-orange-600" />
            <p className="text-sm font-medium text-orange-700">Home | 201, Vinayak Nilaya</p>
          </div>
        </div>

        {!selectedTier && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Choose your Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.pricingTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`group relative p-6 rounded-lg text-left transition-all duration-200 border-[3px] ${
                    selectedTier === tier.id
                      ? 'bg-gray-900 text-white shadow-lg border-gray-900'
                      : 'bg-gray-50 border-gray-300 hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-xl font-bold ${selectedTier === tier.id ? 'text-white' : 'text-gray-900'}`}>
                        {tier.name}
                      </h3>
                      {selectedTier === tier.id && (
                        <div className="bg-white rounded-full p-1">
                          <Check className="text-gray-900" size={16} />
                        </div>
                      )}
                    </div>
                    <p className={`text-lg font-semibold ${selectedTier === tier.id ? 'text-gray-200' : 'text-blue-600'}`}>
                      Starting at ₹{tier.price} for the 1st hour
                    </p>
                  </div>

                  <div className="space-y-6">
                    {tier.included && tier.included.length > 0 && (
                      <div>
                        <h4 className={`text-xs font-semibold mb-3 uppercase tracking-wide ${selectedTier === tier.id ? 'text-gray-300' : 'text-gray-700'}`}>
                          What's included:
                        </h4>
                        <ul className="space-y-2">
                          {tier.included.map((item, idx) => (
                            <li key={idx} className={`flex items-start gap-2 text-xs ${selectedTier === tier.id ? 'text-gray-200' : 'text-gray-600'}`}>
                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check size={10} className="text-white" strokeWidth={3} />
                              </div>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tier.notIncluded && tier.notIncluded.length > 0 && (
                      <div>
                        <h4 className={`text-xs font-semibold mb-3 uppercase tracking-wide ${selectedTier === tier.id ? 'text-gray-300' : 'text-gray-700'}`}>
                          What's not included:
                        </h4>
                        <ul className="space-y-2">
                          {tier.notIncluded.map((item, idx) => (
                            <li key={idx} className={`flex items-start gap-2 text-xs ${selectedTier === tier.id ? 'text-gray-200' : 'text-gray-600'}`}>
                              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-[10px] font-bold">✕</span>
                              </div>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTier && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="grid grid-cols-4 border-b border-gray-200">
                <button
                  onClick={() => handleModeChange('single')}
                  className={`flex flex-col items-center py-3 px-3 font-medium transition-all duration-200 ${
                    bookingMode === 'single'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : 'text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  <CalendarIcon size={18} className="mb-0.5" />
                  <div className="text-xs">Single Booking</div>
                </button>
                <button
                  onClick={() => handleModeChange('multiple')}
                  className={`flex flex-col items-center py-3 px-3 font-medium transition-all duration-200 border-x border-gray-200 ${
                    bookingMode === 'multiple'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : 'text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  <CalendarIcon size={18} className="mb-0.5" />
                  <div className="text-xs">Bulk Schedule</div>
                </button>
                <button
                  onClick={() => handleModeChange('custom')}
                  className={`flex flex-col items-center py-3 px-3 font-medium transition-all duration-200 border-r border-gray-200 ${
                    bookingMode === 'custom'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : 'text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  <Clock size={18} className="mb-0.5" />
                  <div className="text-xs">Weekly Routine</div>
                </button>
                <button
                  onClick={() => handleModeChange('flexible')}
                  className={`flex flex-col items-center py-3 px-3 font-medium transition-all duration-200 ${
                    bookingMode === 'flexible'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : 'text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  <CalendarIcon size={18} className="mb-0.5" />
                  <div className="text-xs">Custom Schedule</div>
                </button>
              </div>

              {bookingMode === 'custom' && (
                <div className="p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Days</h3>
                  <div className="flex gap-2 justify-between mb-6">
                    {WEEKDAYS.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => toggleWeekday(index)}
                        className={`w-11 h-11 rounded-lg font-semibold text-sm transition-all duration-200 ${
                          selectedWeekdays.includes(index)
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {selectedWeekdays.length > 0 && (
                    <>
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Dates</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`flex-1 px-4 py-3 rounded-lg text-center font-medium text-sm transition-all ${
                          startDate ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {startDate ? startDate.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Start Date'}
                        </div>
                        {startDate && endDate && (
                          <div className="px-3 py-2 bg-orange-100 text-orange-700 font-semibold text-sm rounded-full">
                            {selectedDates.length} Days
                          </div>
                        )}
                        <div className={`flex-1 px-4 py-3 rounded-lg text-center font-medium text-sm transition-all ${
                          endDate ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {endDate ? endDate.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'End Date'}
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {WEEKDAYS.map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                      </div>

                      {weekAlignedCalendar.map(({ month, weeks }) => (
                        <div key={month} className="mb-4 last:mb-0">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{month}</h4>
                          {weeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="grid grid-cols-7 gap-1.5 mb-1.5">
                              {week.map((date, dayIdx) => {
                                if (!date) {
                                  return <div key={dayIdx} className="h-9" />;
                                }

                                const { day } = getDateDisplay(date);
                                const isSelected = isDateSelected(date);
                                const isToday = formatDate(date) === formatDate(new Date());
                                const inRange = isDateInRange(date);
                                const matchesWeekday = matchesSelectedWeekdays(date);

                                return (
                                  <button
                                    key={dayIdx}
                                    onClick={() => handleDateClick(date)}
                                    disabled={!matchesWeekday}
                                    className={`h-9 rounded-md flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                                        : inRange && matchesWeekday
                                        ? 'bg-orange-200 text-orange-900'
                                        : matchesWeekday
                                        ? isToday
                                          ? 'bg-orange-50 text-orange-900 ring-2 ring-orange-500'
                                          : 'bg-orange-50/30 text-gray-700 hover:bg-orange-100 border border-orange-200'
                                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {bookingMode === 'flexible' && (
                <div className="p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Add Schedule</h3>

                  {flexibleBookings.length > 0 && (
                    <div className="mb-6 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Your Bookings:</h4>
                      {flexibleBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg p-3 border border-orange-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-white rounded-md px-3 py-1.5">
                              <div className="text-xs text-gray-500 uppercase">
                                {booking.date.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {booking.date.getDate()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {booking.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              </div>
                              <div className="text-xs text-orange-600 font-medium">
                                {booking.timeSlot}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFlexibleBooking(booking.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md p-1.5 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-orange-50/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Select Date & Time</h4>

                    {tempFlexibleDate && (
                      <div className="mb-4 p-3 bg-white rounded-lg border-2 border-orange-400">
                        <div className="text-sm font-semibold text-gray-900">
                          Selected: {tempFlexibleDate.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    )}

                    {Object.entries(groupedByMonth).map(([month, dates]) => (
                      <div key={month} className="mb-4 last:mb-0">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{month}</h5>
                        <div className="grid grid-cols-7 gap-1.5">
                          {dates.map((date, idx) => {
                            const { day } = getDateDisplay(date);
                            const isSelected = tempFlexibleDate?.formatted === formatDate(date);
                            const isToday = formatDate(date) === formatDate(new Date());
                            const isInBookings = isDateInFlexibleBookings(date);

                            return (
                              <button
                                key={idx}
                                onClick={() => handleFlexibleDateClick(date)}
                                className={`h-9 rounded-md flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                                    : isInBookings
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : isToday
                                    ? 'bg-orange-50 text-orange-900 ring-2 ring-orange-500'
                                    : 'bg-orange-50/30 text-gray-700 hover:bg-orange-100 border border-orange-200'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {tempFlexibleDate && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Select Time</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(TIME_SLOTS).map(([category, slots]) => (
                            <div key={category}>
                              <div className="text-xs font-medium text-gray-600 uppercase mb-1 capitalize">{category}</div>
                              <select
                                value={tempFlexibleTime}
                                onChange={(e) => setTempFlexibleTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                              >
                                <option value="">Select time</option>
                                {slots.map((slot) => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={addFlexibleBooking}
                          disabled={!tempFlexibleDate || !tempFlexibleTime}
                          className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-200"
                        >
                          Add Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {bookingMode !== 'custom' && bookingMode !== 'flexible' && (
                <div className="p-6">
                  {bookingMode === 'single' && (
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Select Date</h3>
                  )}

                  {bookingMode === 'multiple' && (
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Dates</h3>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 px-4 py-3 rounded-lg text-center font-medium text-sm transition-all ${
                          startDate ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {startDate ? startDate.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Start Date'}
                        </div>
                        <div className="px-3 py-2 bg-orange-100 text-orange-700 font-semibold text-sm rounded-full">
                          {selectedDates.length} Days
                        </div>
                        <div className={`flex-1 px-4 py-3 rounded-lg text-center font-medium text-sm transition-all ${
                          endDate ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {endDate ? endDate.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'End Date'}
                        </div>
                      </div>
                    </div>
                  )}

                  {Object.entries(groupedByMonth).map(([month, dates]) => (
                    <div key={month} className="mb-4 last:mb-0">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{month}</h4>
                      <div className="grid grid-cols-7 gap-1.5">
                        {dates.map((date, idx) => {
                          const { day } = getDateDisplay(date);
                          const isSelected = isDateSelected(date);
                          const isToday = formatDate(date) === formatDate(new Date());
                          const inRange = isDateInRange(date);

                          return (
                            <button
                              key={idx}
                              onClick={() => handleDateClick(date)}
                              className={`h-9 rounded-md flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                                  : inRange
                                  ? 'bg-orange-200 text-orange-900'
                                  : isToday
                                  ? 'bg-orange-50 text-orange-900 ring-2 ring-orange-500'
                                  : 'bg-orange-50/30 text-gray-700 hover:bg-orange-100 border border-orange-200'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl shadow-sm border border-orange-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-orange-900">Duration</h3>
                {bookingMode === 'multiple' && selectedDates.length > 0 && (
                  <span className="text-xs text-orange-700 font-medium">
                    Price for {selectedDates.length} days.
                  </span>
                )}
                {bookingMode === 'custom' && selectedDates.length > 0 && (
                  <span className="text-xs text-orange-700 font-medium">
                    Price for {selectedDates.length} days.
                  </span>
                )}
                {bookingMode === 'flexible' && flexibleBookings.length > 0 && (
                  <span className="text-xs text-orange-700 font-medium">
                    Price for {flexibleBookings.length} bookings.
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DURATION_OPTIONS.map((option) => {
                  const visitCount = (bookingMode === 'multiple' || bookingMode === 'custom') ? selectedDates.length :
                                    bookingMode === 'flexible' ? flexibleBookings.length : 1;
                  const currentPrice = bookingMode === 'single' ? option.singlePrice :
                                      (bookingMode === 'multiple' || bookingMode === 'custom' || bookingMode === 'flexible') ? option.singlePrice * visitCount :
                                      option.customPrice;

                  return (
                    <button
                      key={option.minutes}
                      onClick={() => setSelectedDuration(option)}
                      className={`relative p-4 rounded-xl transition-all duration-200 ${
                        selectedDuration.minutes === option.minutes
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg scale-105 ring-2 ring-orange-300'
                          : 'bg-white border-2 border-orange-200 hover:border-orange-300 hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className={`text-base font-bold mb-1 ${selectedDuration.minutes === option.minutes ? 'text-white' : 'text-orange-900'}`}>
                        {option.label}
                      </div>
                      <div className="flex items-baseline gap-1 justify-center">
                        <span className={`text-lg font-bold ${selectedDuration.minutes === option.minutes ? 'text-white' : 'text-orange-600'}`}>
                          ₹{currentPrice}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Service Location</h3>

              <div className="mb-4">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="mr-1 text-blue-600" />
                  Bangalore Area
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                >
                  <option value="">Select your area</option>
                  {BANGALORE_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Flat number, Building name, Street, Landmark..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {bookingMode !== 'flexible' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Start Time</h3>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSelectedTimeCategory('morning')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    selectedTimeCategory === 'morning'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-orange-50 text-gray-700 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  Morning
                </button>
                <button
                  onClick={() => setSelectedTimeCategory('afternoon')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    selectedTimeCategory === 'afternoon'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-orange-50 text-gray-700 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  Afternoon
                </button>
                <button
                  onClick={() => setSelectedTimeCategory('evening')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    selectedTimeCategory === 'evening'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-orange-50 text-gray-700 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  Evening
                </button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                {getVisibleTimeSlots().map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                      selectedTimeSlot === slot
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                        : 'bg-orange-50 border border-orange-200 text-gray-700 hover:bg-orange-100 hover:border-orange-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {TIME_SLOTS[selectedTimeCategory].length > 12 && (
                <button
                  onClick={() => setShowMoreSlots(!showMoreSlots)}
                  className="w-full text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors py-2"
                >
                  {showMoreSlots ? '↑ Show less' : '↓ Show more'}
                </button>
              )}
              </div>
            )}

            {((bookingMode !== 'flexible' && selectedTimeSlot && getVisitCount() > 0) || (bookingMode === 'flexible' && flexibleBookings.length > 0)) && (
              <div className="mb-24">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-orange-900">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-2 rounded-lg">
                      <Clock size={18} />
                    </div>
                    <span className="font-medium text-sm">
                      {getVisitCount()} visit{getVisitCount() > 1 ? 's' : ''}{bookingMode !== 'flexible' && `, ${selectedTimeSlot}`} • {selectedDuration.label} sessions
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-orange-600 font-medium text-sm hover:text-orange-800 underline"
                  >
                    {showBreakdown ? 'Hide' : 'View Breakdown'}
                  </button>
                </div>

                {showBreakdown && (
                  <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Duration:</span>
                        <span className="font-medium text-gray-900">{selectedDuration.label}</span>
                      </div>
                      {bookingMode !== 'flexible' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time Slot:</span>
                          <span className="font-medium text-gray-900">{selectedTimeSlot}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number of Visits:</span>
                        <span className="font-medium text-gray-900">{getVisitCount()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price per Visit:</span>
                        <span className="font-medium text-gray-900">₹{selectedDuration.singlePrice}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                        <span className="font-semibold text-gray-900">Total Amount:</span>
                        <span className="font-bold text-orange-600 text-lg">₹{getCurrentPrice()}</span>
                      </div>
                    </div>

                    {bookingMode === 'multiple' && selectedDates.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Selected Dates:</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedDates.map((dateObj, idx) => (
                            <span key={idx} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                              {dateObj.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bookingMode === 'custom' && selectedWeekdays.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Selected Days:</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedWeekdays.map((dayIdx) => (
                            <span key={dayIdx} className="bg-orange-50 text-orange-700 px-3 py-1 rounded text-xs font-medium">
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIdx]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bookingMode === 'flexible' && flexibleBookings.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Scheduled Bookings:</h5>
                        <div className="space-y-2">
                          {flexibleBookings.map((booking, idx) => (
                            <div key={booking.id} className="flex justify-between items-center bg-orange-50 text-orange-700 px-3 py-2 rounded text-xs">
                              <span className="font-medium">
                                {booking.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="font-semibold">{booking.timeSlot}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:px-6 shadow-lg z-50">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">Pay using 💳</div>
                <button
                  onClick={handleCheckout}
                  disabled={!isFormValid()}
                  className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center gap-3 shadow-sm"
                >
                  <span className="text-lg">₹{getCurrentPrice()}</span>
                  <span>Pay Now →</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookingBooking;
