import { useState, useEffect } from 'react';
import { Minus, Plus, Info } from 'lucide-react';
import {
  MealFrequency,
  MEAL_FREQUENCY_LABELS,
  getMonthlyBasePrice,
  getMonthlyDiscount,
} from '../../data/cookingPlans';

export interface MonthlyState {
  people: number;
  mealFrequency: MealFrequency;
  upfrontMonths: 1 | 2 | 3;
  addNonVeg: boolean;
  addDeepCleaning: boolean;
  specialRequest: string;
}

interface MonthlyCustomizerProps {
  onChange: (state: MonthlyState, price: number, isValid: boolean) => void;
}

const UPFRONT_OPTIONS: { months: 1 | 2 | 3; label: string }[] = [
  { months: 1, label: '1 Month' },
  { months: 2, label: '2 Months' },
  { months: 3, label: '3 Months' },
];

const NON_VEG_ADDON_PRICE = 1000;
const DEEP_CLEANING_ADDON_PRICE = 1000;

const MonthlyCustomizer = ({ onChange }: MonthlyCustomizerProps) => {
  const [state, setState] = useState<MonthlyState>({
    people: 2,
    mealFrequency: '1meal',
    upfrontMonths: 1,
    addNonVeg: false,
    addDeepCleaning: false,
    specialRequest: '',
  });
  const [showLargeGroupBanner, setShowLargeGroupBanner] = useState(false);

  const monthlyBase = getMonthlyBasePrice(state.people, state.mealFrequency);
  const addOnPerMonth =
    (state.addNonVeg ? NON_VEG_ADDON_PRICE : 0) +
    (state.addDeepCleaning ? DEEP_CLEANING_ADDON_PRICE : 0);
  const totalPerMonth = monthlyBase + addOnPerMonth;
  const rawTotal = totalPerMonth * state.upfrontMonths;
  const discount = getMonthlyDiscount(state.upfrontMonths);
  const discountedTotal = Math.round(rawTotal * (1 - discount));
  const savings = rawTotal - discountedTotal;

  const isValid = state.people >= 1 && state.people <= 6;

  useEffect(() => {
    onChange(state, discountedTotal, isValid);
  }, [state]);

  const update = (patch: Partial<MonthlyState>) => {
    setState(prev => ({ ...prev, ...patch }));
  };

  const handlePeopleChange = (delta: number) => {
    const next = state.people + delta;
    if (next > 6) {
      setShowLargeGroupBanner(true);
      return;
    }
    if (next < 1) return;
    setShowLargeGroupBanner(false);
    update({ people: next });
  };

  const frequencyOptions: MealFrequency[] = ['1meal', '2meals', 'breakfast2meals'];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          Number of People
          <span className="text-xs text-gray-500 font-normal ml-2">Max 6 for this plan</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handlePeopleChange(-1)}
            disabled={state.people <= 1}
            className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-bold"
          >
            <Minus size={16} />
          </button>
          <div className="text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900">{state.people}</div>
            <div className="text-xs text-gray-500">
              {state.people === 1 ? 'person' : 'people'}
            </div>
          </div>
          <button
            onClick={() => handlePeopleChange(1)}
            className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center justify-center transition-colors font-bold"
          >
            <Plus size={16} />
          </button>
        </div>

        {showLargeGroupBanner && (
          <div className="mt-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 animate-pulse-once">
            <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Large Group / Corporate?</p>
              <p className="text-xs text-amber-700 mt-0.5">
                For families larger than 6 or corporate accommodations, please{' '}
                <a
                  href="tel:+918008000000"
                  className="underline font-semibold hover:text-amber-900"
                >
                  Contact Us
                </a>{' '}
                for custom pricing tailored to your needs.
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          Meal Frequency <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {frequencyOptions.map(freq => (
            <button
              key={freq}
              onClick={() => update({ mealFrequency: freq })}
              className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-all border-2 ${
                state.mealFrequency === freq
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              {MEAL_FREQUENCY_LABELS[freq]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">What's Included</h4>
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
          <div className="flex items-center gap-4 px-4 py-3 bg-orange-50/50">
            <div className="w-28 flex-shrink-0 text-[11px] font-semibold text-orange-700 uppercase tracking-wide">Roti Type</div>
            <div className="text-sm text-gray-600">Can choose from Fulka / Paratha / Puri</div>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-orange-50/30">
            <div className="w-28 flex-shrink-0 text-[11px] font-semibold text-orange-700 uppercase tracking-wide">Dal</div>
            <div className="text-sm text-gray-600">Can choose from Dal Fry / Tadka / Sambhar / Plain</div>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-orange-50/50">
            <div className="w-28 flex-shrink-0 text-[11px] font-semibold text-orange-700 uppercase tracking-wide">Rice</div>
            <div className="text-sm text-gray-600">Can choose from Jeera / Lemon / Tomato / Pulav / Plain</div>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-orange-50/30">
            <div className="w-28 flex-shrink-0 text-[11px] font-semibold text-orange-700 uppercase tracking-wide">Non-Veg Dishes</div>
            <div className="text-sm text-gray-600">Can choose from Chicken / Mutton / Fish / Egg</div>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-orange-50/50">
            <div className="w-28 flex-shrink-0 text-[11px] font-semibold text-orange-700 uppercase tracking-wide">Fresh Salad</div>
            <div className="text-sm text-gray-600">Can choose from Green Veggie Salad / Peanut Salad</div>
          </div>
        </div>

      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Add-ons</h4>
        <div className="space-y-3">
          <button
            onClick={() => update({ addNonVeg: !state.addNonVeg })}
            className={`w-full bg-orange-50 border-2 rounded-lg px-4 py-3 text-left transition-all ${
              state.addNonVeg
                ? 'border-orange-500 shadow-sm'
                : 'border-orange-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Non-Veg Twice a Week</div>
                <div className="text-xs text-gray-500 mt-0.5">Chicken / Mutton / Fish / Egg · 2 days per week</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-orange-600">+ ₹1,000 / month</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  state.addNonVeg
                    ? 'bg-orange-500 border-orange-500'
                    : 'bg-white border-gray-300'
                }`}>
                  {state.addNonVeg && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => update({ addDeepCleaning: !state.addDeepCleaning })}
            className={`w-full bg-orange-50 border-2 rounded-lg px-4 py-3 text-left transition-all ${
              state.addDeepCleaning
                ? 'border-orange-500 shadow-sm'
                : 'border-orange-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Deep Cleaning of Kitchen</div>
                <div className="text-xs text-gray-500 mt-0.5">Professional deep clean · Once a month</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-orange-600">+ ₹1,000 / month</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  state.addDeepCleaning
                    ? 'bg-orange-500 border-orange-500'
                    : 'bg-white border-gray-300'
                }`}>
                  {state.addDeepCleaning && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Upfront Duration
        </label>
        <div className="grid grid-cols-3 gap-2">
          {UPFRONT_OPTIONS.map(({ months, label }) => {
            const optionAddOn =
              (state.addNonVeg ? NON_VEG_ADDON_PRICE : 0) +
              (state.addDeepCleaning ? DEEP_CLEANING_ADDON_PRICE : 0);
            const optionRaw = (monthlyBase + optionAddOn) * months;
            const optionFinal = Math.round(optionRaw * (1 - getMonthlyDiscount(months)));
            const isSelected = state.upfrontMonths === months;

            return (
              <button
                key={months}
                onClick={() => update({ upfrontMonths: months })}
                className={`px-2 py-2 rounded-lg text-center transition-all border-2 ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                <div className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {label}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-orange-600'}`}>
                  ₹{optionFinal.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Price Summary</h4>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{MEAL_FREQUENCY_LABELS[state.mealFrequency]} ({state.people} {state.people === 1 ? 'person' : 'people'})</span>
            <span>₹{monthlyBase.toLocaleString()} / month</span>
          </div>
          {state.addNonVeg && (
            <div className="flex justify-between text-gray-600">
              <span>Non-Veg Twice a Week</span>
              <span>₹{NON_VEG_ADDON_PRICE.toLocaleString()} / month</span>
            </div>
          )}
          {state.addDeepCleaning && (
            <div className="flex justify-between text-gray-600">
              <span>Deep Cleaning of Kitchen</span>
              <span>₹{DEEP_CLEANING_ADDON_PRICE.toLocaleString()} / month</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Duration</span>
            <span>{state.upfrontMonths} month{state.upfrontMonths > 1 ? 's' : ''}</span>
          </div>
          {discount > 0 && (
            <>
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="line-through">₹{rawTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount ({discount * 100}% off)</span>
                <span>− ₹{savings.toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-orange-200 pt-2 mt-2">
            <span>Total Payable</span>
            <span className="text-orange-600 text-base">₹{discountedTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCustomizer;
