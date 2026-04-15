import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, ChefHat, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { TIME_SLOTS as GLOBAL_TIME_SLOTS, BANGALORE_LOCATIONS } from '../types';
import { isTimeSlotDisabled } from '../lib/timeUtils';
import { COOKING_PLANS, PlanId, getRotiQty, MEAL_FREQUENCY_LABELS } from '../data/cookingPlans';
import PlanCard from '../components/cooking/PlanCard';
import VegCustomizer from '../components/cooking/VegCustomizer';
import NonVegCustomizer from '../components/cooking/NonVegCustomizer';
import BitesCustomizer from '../components/cooking/BitesCustomizer';
import MonthlyCustomizer from '../components/cooking/MonthlyCustomizer';

type BookingMode = 'single' | 'custom' | 'flexible';
type TimeCategory = 'morning' | 'afternoon' | 'evening';

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

const TIME_SLOTS = {
  morning: GLOBAL_TIME_SLOTS.Morning,
  afternoon: GLOBAL_TIME_SLOTS.Afternoon,
  evening: GLOBAL_TIME_SLOTS.Evening,
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CookingBooking = () => {
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<PlanId | ''>('');
  const [customizerPrice, setCustomizerPrice] = useState(0);
  const [customizerValid, setCustomizerValid] = useState(false);
  const [customizerSummary, setCustomizerSummary] = useState('');
  const [customizerDetails, setCustomizerDetails] = useState<unknown>(null);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  const [bookingMode, setBookingMode] = useState<BookingMode>('single');
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<TimeCategory>('evening');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [startDate, setStartDate] = useState<SelectedDate | null>(null);
  const [endDate, setEndDate] = useState<SelectedDate | null>(null);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [showMoreSlots, setShowMoreSlots] = useState(false);
  const [flexibleBookings, setFlexibleBookings] = useState<FlexibleBooking[]>([]);
  const [tempFlexibleDate, setTempFlexibleDate] = useState<SelectedDate | null>(null);
  const [tempFlexibleTime, setTempFlexibleTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [address, setAddress] = useState('');

  const isMonthly = selectedPlan === 'monthly';

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getDateDisplay = (date: Date) => ({
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  });

  const generateCalendarDays = () => {
    const today = new Date();
    const days: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
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
    const calData: { month: string; weeks: (Date | null)[][] }[] = [];
    const rangeEnd = new Date(today);
    rangeEnd.setDate(today.getDate() + 60);

    let currentMonth = today.getMonth();
    let monthWeeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    const firstDay = today.getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) currentWeek.push(null);

    let cur = new Date(today);
    while (cur <= rangeEnd) {
      if (cur.getMonth() !== currentMonth) {
        while (currentWeek.length < 7) currentWeek.push(null);
        monthWeeks.push(currentWeek);
        calData.push({
          month: new Date(cur.getFullYear(), currentMonth).toLocaleDateString('en-US', { month: 'long' }),
          weeks: monthWeeks,
        });
        currentMonth = cur.getMonth();
        monthWeeks = [];
        currentWeek = [];
        const dow = cur.getDay();
        const mo = dow === 0 ? 6 : dow - 1;
        for (let i = 0; i < mo; i++) currentWeek.push(null);
      }
      currentWeek.push(new Date(cur));
      if (currentWeek.length === 7) {
        monthWeeks.push(currentWeek);
        currentWeek = [];
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      monthWeeks.push(currentWeek);
    }
    if (monthWeeks.length > 0) {
      calData.push({
        month: new Date(cur.getFullYear(), currentMonth).toLocaleDateString('en-US', { month: 'long' }),
        weeks: monthWeeks,
      });
    }
    return calData;
  };

  const weekAlignedCalendar = generateWeekAlignedCalendar();

  const isDateSelected = (date: Date) => {
    const formatted = formatDate(date);
    if (bookingMode === 'single') return selectedDate?.formatted === formatted;
    return selectedDates.some(d => d.formatted === formatted);
  };

  const isDateInRange = (date: Date) => {
    if (bookingMode !== 'custom' || !startDate || !endDate) return false;
    return date >= startDate.date && date <= endDate.date;
  };

  const matchesSelectedWeekdays = (date: Date) => {
    if (bookingMode !== 'custom' || selectedWeekdays.length === 0) return false;
    const dow = date.getDay();
    const mapped = dow === 0 ? 6 : dow - 1;
    return selectedWeekdays.includes(mapped);
  };

  const generateDateRange = (start: Date, end: Date, filterByWeekdays = false): SelectedDate[] => {
    const dates: SelectedDate[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      if (!filterByWeekdays || matchesSelectedWeekdays(cur)) {
        dates.push({ date: new Date(cur), formatted: formatDate(cur) });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  const handleDateClick = (date: Date) => {
    const formatted = formatDate(date);
    if (bookingMode === 'single') {
      setSelectedDate({ date, formatted });
    } else if (bookingMode === 'custom') {
      if (selectedWeekdays.length === 0) return;
      if (!startDate) {
        setStartDate({ date, formatted });
        setEndDate(null);
        setSelectedDates([]);
      } else if (!endDate) {
        if (formatted === startDate.formatted) return;
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
    setSelectedWeekdays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
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
    setTempFlexibleDate({ date, formatted: formatDate(date) });
    setTempFlexibleTime('');
  };

  const addFlexibleBooking = () => {
    if (!tempFlexibleDate || !tempFlexibleTime) return;
    setFlexibleBookings(prev => [
      ...prev,
      {
        id: `${tempFlexibleDate.formatted}-${tempFlexibleTime}-${Date.now()}`,
        date: tempFlexibleDate.date,
        formatted: tempFlexibleDate.formatted,
        timeSlot: tempFlexibleTime,
      },
    ]);
    setTempFlexibleDate(null);
    setTempFlexibleTime('');
  };

  const removeFlexibleBooking = (id: string) => {
    setFlexibleBookings(prev => prev.filter(b => b.id !== id));
  };

  const getVisitCount = () => {
    if (bookingMode === 'single') return 1;
    if (bookingMode === 'custom') return selectedDates.length;
    if (bookingMode === 'flexible') return flexibleBookings.length;
    return 0;
  };

  const getVisibleTimeSlots = () => {
    const slots = TIME_SLOTS[selectedTimeCategory];
    return showMoreSlots ? slots : slots.slice(0, 12);
  };

  const handleCustomizerChange = useCallback(
    (state: unknown, price: number, isValid: boolean, summary?: string) => {
      setCustomizerPrice(price);
      setCustomizerValid(isValid);
      setCustomizerSummary(summary || '');
      setCustomizerDetails(state);
    },
    []
  );

  const isScheduleValid = () => {
    if (!selectedLocation || !address.trim()) return false;
    if (isMonthly) {
      return selectedDate !== null && !!selectedTimeSlot;
    }
    if (bookingMode === 'flexible') return flexibleBookings.length > 0;
    if (!selectedTimeSlot) return false;
    if (bookingMode === 'single') return selectedDate !== null;
    return selectedDates.length > 0;
  };

  const isFormValid = () => customizerValid && isScheduleValid();

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId as PlanId);
    setBookingMode('single');
    setSelectedDate(null);
    setSelectedDates([]);
    setStartDate(null);
    setEndDate(null);
    setSelectedWeekdays([]);
    setFlexibleBookings([]);
    setSelectedTimeSlot('');
  };

  const handleBack = () => {
    if (selectedPlan) {
      setSelectedPlan('');
      setCustomizerPrice(0);
      setCustomizerValid(false);
      setCustomizerSummary('');
    } else {
      navigate(-1);
    }
  };

  const handleCheckout = () => {
    if (!isFormValid()) return;
    const plan = COOKING_PLANS.find(p => p.id === selectedPlan);
    const visitCount = getVisitCount();
    const bookingData = {
      serviceId: 'home-cooking',
      serviceName: 'Home Cooking',
      tier: `${plan?.name}${customizerSummary ? ` — ${customizerSummary}` : ''}`,
      bookingMode,
      date: selectedDate?.formatted || selectedDates[0]?.formatted || flexibleBookings[0]?.formatted,
      dates: bookingMode === 'flexible'
        ? flexibleBookings.map(b => b.formatted)
        : selectedDates.map(d => d.formatted),
      weekdays: selectedWeekdays,
      timeSlot: bookingMode === 'flexible' ? flexibleBookings[0]?.timeSlot : selectedTimeSlot,
      flexibleBookings: bookingMode === 'flexible' ? flexibleBookings : undefined,
      location: selectedLocation,
      address,
      price: customizerPrice,
      visits: visitCount,
      customizerDetails: {
        plan: selectedPlan,
        ...( customizerDetails as object ?? {} ),
      },
    };
    navigate('/checkout', { state: { bookingData } });
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
              {selectedPlan ? 'Customise Your Meal' : 'Choose Your Plan'}
            </h1>
          </div>
        </div>

        {!selectedPlan && (
          <div>
            <p className="text-gray-500 text-sm mb-6 font-semibold">
              Select the plan that best fits your household. Pricing will be shown once you customise.
            </p>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:[grid-template-rows:auto_auto_auto_auto]">
                {COOKING_PLANS.slice(0, 2).map(plan => (
                  <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:[grid-template-rows:auto_auto_auto_auto]">
                {COOKING_PLANS.slice(2, 4).map(plan => (
                  <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedPlan && (
          <>
            {(() => {
              const plan = COOKING_PLANS.find(p => p.id === selectedPlan)!;
              return (
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-100 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Selected Plan</span>
                  </div>
                  <span className="text-base font-bold text-gray-800">{plan.name}</span>
                  {plan.badge && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Meal Customisation</h2>
              {selectedPlan === 'veg' && (
                <VegCustomizer
                  onChange={(state, price, isValid) => {
                    const rotiQty = getRotiQty(state.people);
                    const label = `${state.people} ${state.people === 1 ? 'person' : 'people'}`;
                    const dishes = [
                      `max ${rotiQty} Roti`,
                      state.vegetable || 'Vegetable (select)',
                      state.addExtraVeg,
                      'Dal',
                      'Rice',
                      state.extraRotisCount > 0 ? `+${state.extraRotisCount} extra rotis` : null,
                    ].filter(Boolean);
                    handleCustomizerChange(state, price, isValid, `Meal for ${label} — ${dishes.join(', ')}`);
                  }}
                />
              )}
              {selectedPlan === 'nonveg' && (
                <NonVegCustomizer
                  onChange={(state, price, isValid) => {
                    const rotiQty = getRotiQty(state.people);
                    const label = `${state.people} ${state.people === 1 ? 'person' : 'people'}`;
                    const dishes = [
                      `max ${rotiQty} Roti`,
                      state.nonVegItem || 'Non-Veg (select)',
                      state.addExtraNonVeg,
                      state.addDal,
                      'Rice',
                      state.extraRotisCount > 0 ? `+${state.extraRotisCount} extra rotis` : null,
                    ].filter(Boolean);
                    handleCustomizerChange(state, price, isValid, `Meal for ${label} — ${dishes.join(', ')}`);
                  }}
                />
              )}
              {selectedPlan === 'bites' && (
                <BitesCustomizer
                  onChange={(state, price, isValid) => {
                    const label = `${state.people} ${state.people === 1 ? 'person' : 'people'}`;
                    const mainDish =
                      state.dishType === 'custom' ? state.customDish :
                      state.dishType === 'curated' ? state.selectedCuratedDish :
                      state.dishType === 'streetfood' ? state.selectedStreetFood : '';
                    const allItems = [mainDish, ...state.extraCuratedItems, ...state.extraStreetFoodItems, state.beverage].filter(Boolean);
                    const summary = allItems.length
                      ? `Bites for ${label} — ${allItems.join(', ')}`
                      : `Bites for ${label} — configure above`;
                    handleCustomizerChange(state, price, isValid, summary);
                  }}
                />
              )}
              {selectedPlan === 'monthly' && (
                <MonthlyCustomizer
                  onChange={(state, price, isValid) => {
                    const label = `${state.people} ${state.people === 1 ? 'person' : 'people'}`;
                    const freq = MEAL_FREQUENCY_LABELS[state.mealFrequency];
                    const duration = `${state.upfrontMonths} month${state.upfrontMonths > 1 ? 's' : ''}`;
                    handleCustomizerChange(
                      state,
                      price,
                      isValid,
                      `${label} · ${freq} · ${duration} — Roti, Dal, Veg & Rice daily`
                    );
                  }}
                />
              )}
            </div>

            {!isMonthly && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="grid grid-cols-3 border-b border-gray-200">
                  {(
                    [
                      { mode: 'single', label: 'Single Day' },
                      { mode: 'custom', label: 'Weekly Routine' },
                      { mode: 'flexible', label: 'Custom Days' },
                    ] as { mode: BookingMode; label: string }[]
                  ).map(({ mode, label }, i) => (
                    <button
                      key={mode}
                      onClick={() => handleModeChange(mode)}
                      className={`flex flex-col items-center py-3 px-1 font-medium transition-all duration-200 text-xs leading-tight text-center ${
                        i === 1 ? 'border-x border-gray-200' : ''
                      } ${
                        bookingMode === mode
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                          : 'text-gray-600 hover:bg-orange-50'
                      }`}
                    >
                      <CalendarIcon size={16} className="mb-1 flex-shrink-0" />
                      {label}
                    </button>
                  ))}
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
                          <div className={`flex-1 px-4 py-3 rounded-lg text-center font-medium text-sm ${startDate ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {startDate ? startDate.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Start Date'}
                          </div>
                          {startDate && endDate && (
                            <div className="px-3 py-2 bg-orange-100 text-orange-700 font-semibold text-sm rounded-full">
                              {selectedDates.length} Days
                            </div>
                          )}
                          <div className={`flex-1 px-4 py-3 rounded-lg text-center font-medium text-sm ${endDate ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {endDate ? endDate.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'End Date'}
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5 mb-2">
                          {WEEKDAYS.map((day, i) => (
                            <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
                          ))}
                        </div>
                        {weekAlignedCalendar.map(({ month, weeks }) => (
                          <div key={month} className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{month}</h4>
                            {weeks.map((week, wi) => (
                              <div key={wi} className="grid grid-cols-7 gap-1.5 mb-1.5">
                                {week.map((date, di) => {
                                  if (!date) return <div key={di} className="h-9" />;
                                  const { day } = getDateDisplay(date);
                                  const isSelected = isDateSelected(date);
                                  const inRange = isDateInRange(date);
                                  const matches = matchesSelectedWeekdays(date);
                                  return (
                                    <button
                                      key={di}
                                      onClick={() => handleDateClick(date)}
                                      disabled={!matches}
                                      className={`h-9 rounded-md flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                                        isSelected ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                                        : inRange && matches ? 'bg-orange-200 text-orange-900'
                                        : matches ? 'bg-orange-50/30 text-gray-700 hover:bg-orange-100 border border-orange-200'
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
                        {flexibleBookings.map(booking => (
                          <div key={booking.id} className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg p-3 border border-orange-200">
                            <div className="flex items-center gap-3">
                              <div className="bg-white rounded-md px-3 py-1.5 text-center">
                                <div className="text-xs text-gray-500 uppercase">{booking.date.toLocaleDateString('en-US', { month: 'short' })}</div>
                                <div className="text-lg font-bold text-gray-900">{booking.date.getDate()}</div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{booking.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                                <div className="text-xs text-orange-600 font-medium">{booking.timeSlot}</div>
                              </div>
                            </div>
                            <button onClick={() => removeFlexibleBooking(booking.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md p-1.5 transition-colors">
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
                        <div key={month} className="mb-4">
                          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{month}</h5>
                          <div className="grid grid-cols-7 gap-1.5">
                            {dates.map((date, idx) => {
                              const { day } = getDateDisplay(date);
                              const isSelected = tempFlexibleDate?.formatted === formatDate(date);
                              const inBookings = flexibleBookings.some(b => b.formatted === formatDate(date));
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleFlexibleDateClick(date)}
                                  className={`h-9 rounded-md flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                                    isSelected ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                                    : inBookings ? 'bg-green-100 text-green-800 border border-green-300'
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
                                  onChange={e => setTempFlexibleTime(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                >
                                  <option value="">Select time</option>
                                  {slots.map(slot => {
                                    const disabled = isTimeSlotDisabled(slot, tempFlexibleDate?.date);
                                    return (
                                      <option key={slot} value={slot} disabled={disabled}>
                                        {slot}{disabled ? ' (unavailable)' : ''}
                                      </option>
                                    );
                                  })}
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

                    {Object.entries(groupedByMonth).map(([month, dates]) => (
                      <div key={month} className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{month}</h4>
                        <div className="grid grid-cols-7 gap-1.5">
                          {dates.map((date, idx) => {
                            const { day } = getDateDisplay(date);
                            const isSelected = isDateSelected(date);
                            const inRange = isDateInRange(date);
                            const isToday = formatDate(date) === formatDate(new Date());
                            return (
                              <button
                                key={idx}
                                onClick={() => handleDateClick(date)}
                                className={`h-9 rounded-md flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                                  isSelected ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                                  : inRange ? 'bg-orange-200 text-orange-900'
                                  : isToday ? 'bg-orange-50 text-orange-900 ring-2 ring-orange-500'
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
            )}

            {isMonthly && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Subscription Start Date</h3>
                {Object.entries(groupedByMonth).map(([month, dates]) => (
                  <div key={month} className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{month}</h4>
                    <div className="grid grid-cols-7 gap-1.5">
                      {dates.map((date, idx) => {
                        const { day } = getDateDisplay(date);
                        const isSelected = selectedDate?.formatted === formatDate(date);
                        const isToday = formatDate(date) === formatDate(new Date());
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedDate({ date, formatted: formatDate(date) })}
                            className={`h-9 rounded-md flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                              isSelected ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-400'
                              : isToday ? 'bg-orange-50 text-orange-900 ring-2 ring-orange-500'
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

            {bookingMode !== 'flexible' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  {isMonthly ? 'Preferred Cook Start Time' : 'Start Time'}
                </h3>
                <div className="flex gap-2 mb-4">
                  {(['morning', 'afternoon', 'evening'] as TimeCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedTimeCategory(cat)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 capitalize ${
                        selectedTimeCategory === cat
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                          : 'bg-orange-50 text-gray-700 hover:bg-orange-100 border border-orange-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                  {getVisibleTimeSlots().map(slot => {
                    const refDate = bookingMode === 'single'
                      ? selectedDate?.date
                      : bookingMode === 'custom'
                      ? startDate?.date
                      : undefined;
                    const disabled = isTimeSlotDisabled(slot, refDate);
                    return (
                      <button
                        key={slot}
                        disabled={disabled}
                        onClick={() => !disabled && setSelectedTimeSlot(slot)}
                        className={`py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                          disabled
                            ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                            : selectedTimeSlot === slot
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                            : 'bg-orange-50 border border-orange-200 text-gray-700 hover:bg-orange-100 hover:border-orange-300'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Service Location</h3>
              <div className="mb-4">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="mr-1 text-orange-600" />
                  Bangalore Area
                </label>
                <select
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-white text-gray-900"
                >
                  <option value="">Select your area</option>
                  {BANGALORE_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complete Address</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House/Flat number, Building name, Street, Landmark..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="mb-24" />
          </>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <button
              onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
              className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                <Clock size={15} className="text-orange-500 flex-shrink-0" />
                <span className="font-medium truncate">
                  {customizerSummary || 'Configure your meal above'}
                </span>
              </div>
              {showPriceBreakdown ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronUp size={16} className="flex-shrink-0" />}
            </button>

            {showPriceBreakdown && customizerPrice > 0 && (
              <div className="pb-3 text-sm border-t border-gray-100 pt-2 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Plan Total</span>
                  <span className="font-semibold text-gray-900">₹{customizerPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="pb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500 font-medium">Total</div>
                <div className="text-xl font-bold text-orange-600">
                  ₹{customizerPrice > 0 ? customizerPrice.toLocaleString() : '—'}
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!isFormValid()}
                className="flex-1 max-w-xs bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Pay</span>
                <span className="text-base">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookingBooking;
