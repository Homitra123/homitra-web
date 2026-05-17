import { useState, useEffect } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { BITES_OPTIONS, getBitesPrice } from '../../data/cookingPlans';

type DishType = '' | 'custom' | 'curated' | 'streetfood';

export interface BitesState {
  people: number;
  dishType: DishType;
  customDish: string;
  selectedCuratedDish: string;
  selectedStreetFood: string;
  beverage: string;
  extraCuratedItems: string[];
  extraStreetFoodItems: string[];
}

interface BitesCustomizerProps {
  onChange: (state: BitesState, price: number, isValid: boolean) => void;
  initialState?: Partial<BitesState>;
}

const EXTRA_CURATED_PRICE = 50;
const EXTRA_STREET_PRICE = 70;

const BitesCustomizer = ({ onChange, initialState }: BitesCustomizerProps) => {
  const [state, setState] = useState<BitesState>({
    people: 2,
    dishType: '',
    customDish: '',
    selectedCuratedDish: '',
    selectedStreetFood: '',
    beverage: '',
    extraCuratedItems: [],
    extraStreetFoodItems: [],
    ...initialState,
  });

  const hasDish =
    (state.dishType === 'custom' && state.customDish.trim().length > 0) ||
    (state.dishType === 'curated' && !!state.selectedCuratedDish) ||
    (state.dishType === 'streetfood' && !!state.selectedStreetFood);

  const isValid = hasDish && !!state.beverage;

  const basePrice = getBitesPrice(state.people);
  const addOnPrice =
    state.extraCuratedItems.length * EXTRA_CURATED_PRICE +
    state.extraStreetFoodItems.length * EXTRA_STREET_PRICE;
  const totalPrice = basePrice + addOnPrice;

  useEffect(() => {
    onChange(state, totalPrice, isValid);
  }, [state]);

  const update = (patch: Partial<BitesState>) => {
    setState(prev => ({ ...prev, ...patch }));
  };

  const selectCurated = (dish: string) => {
    setState(prev => ({
      ...prev,
      dishType: 'curated',
      selectedCuratedDish: dish,
      customDish: '',
      selectedStreetFood: '',
      extraCuratedItems: prev.extraCuratedItems.filter(i => i !== dish),
      extraStreetFoodItems: prev.extraStreetFoodItems,
    }));
  };

  const selectStreetFood = (dish: string) => {
    setState(prev => ({
      ...prev,
      dishType: 'streetfood',
      selectedStreetFood: dish,
      customDish: '',
      selectedCuratedDish: '',
      extraStreetFoodItems: prev.extraStreetFoodItems.filter(i => i !== dish),
      extraCuratedItems: prev.extraCuratedItems,
    }));
  };

  const handleCustomInput = (value: string) => {
    setState(prev => ({
      ...prev,
      dishType: value.trim() ? 'custom' : '',
      customDish: value,
      selectedCuratedDish: '',
      selectedStreetFood: '',
    }));
  };

  const toggleExtraCurated = (item: string) => {
    setState(prev => ({
      ...prev,
      extraCuratedItems: prev.extraCuratedItems.includes(item)
        ? prev.extraCuratedItems.filter(i => i !== item)
        : [...prev.extraCuratedItems, item],
    }));
  };

  const toggleExtraStreetFood = (item: string) => {
    setState(prev => ({
      ...prev,
      extraStreetFoodItems: prev.extraStreetFoodItems.includes(item)
        ? prev.extraStreetFoodItems.filter(i => i !== item)
        : [...prev.extraStreetFoodItems, item],
    }));
  };

  const availableCuratedAddons = BITES_OPTIONS.curatedDishes.filter(
    d => d !== state.selectedCuratedDish
  );
  const availableStreetFoodAddons = BITES_OPTIONS.streetFoods.filter(
    d => d !== state.selectedStreetFood
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          Number of People
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => update({ people: Math.max(1, state.people - 1) })}
            className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center justify-center transition-colors font-bold"
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
            onClick={() => update({ people: Math.min(8, state.people + 1) })}
            className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center justify-center transition-colors font-bold"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-1">
          <h3 className="text-xl font-bold text-gray-900">
            Choose or Customise your Plan
            <span className="text-red-500 ml-1">*</span>
          </h3>
        </div>

        <div className="bg-gray-200 border border-gray-300 rounded-2xl p-5 space-y-5">
          <p className="text-sm font-bold text-gray-700">Select any one option</p>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Own Dish</p>
            <input
              type="text"
              placeholder="Write your dish name here..."
              value={state.customDish}
              onChange={e => handleCustomInput(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm border-2 transition-all outline-none ${
                state.dishType === 'custom'
                  ? 'border-orange-500 bg-white text-gray-900 placeholder-orange-300 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 placeholder-gray-400 hover:border-orange-200 focus:border-orange-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-orange-200" />
            <span className="text-xs font-bold text-orange-500 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-orange-200" />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Curated Food Options</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BITES_OPTIONS.curatedDishes.map(dish => (
                <button
                  key={dish}
                  onClick={() => selectCurated(dish)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 text-left leading-tight ${
                    state.dishType === 'curated' && state.selectedCuratedDish === dish
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {dish}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-orange-200" />
            <span className="text-xs font-bold text-orange-500 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-orange-200" />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Street Food Options</p>
            <div className="grid grid-cols-3 gap-2">
              {BITES_OPTIONS.streetFoods.map(dish => (
                <button
                  key={dish}
                  onClick={() => selectStreetFood(dish)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                    state.dishType === 'streetfood' && state.selectedStreetFood === dish
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {dish}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4 bg-white">
          <div className="flex-shrink-0 text-sm font-bold text-orange-800 uppercase tracking-widest">
            Beverage <span className="text-red-500">*</span>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {BITES_OPTIONS.beverages.map(bev => (
              <button
                key={bev}
                onClick={() => update({ beverage: bev })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                  state.beverage === bev
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                {bev}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Add-ons</h4>
        <div className="space-y-3">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Extra Curated Food Options</p>
                <p className="text-xs text-gray-500 mt-0.5">+₹{EXTRA_CURATED_PRICE} per item</p>
              </div>
              {state.extraCuratedItems.length > 0 && (
                <span className="text-xs font-semibold text-orange-600 bg-white border border-orange-200 rounded-full px-2.5 py-0.5">
                  +₹{state.extraCuratedItems.length * EXTRA_CURATED_PRICE}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableCuratedAddons.map(item => {
                const selected = state.extraCuratedItems.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleExtraCurated(item)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      selected
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    {selected ? <X size={11} /> : <span className="font-bold">+</span>}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Extra Street Food</p>
                <p className="text-xs text-gray-500 mt-0.5">+₹{EXTRA_STREET_PRICE} per item</p>
              </div>
              {state.extraStreetFoodItems.length > 0 && (
                <span className="text-xs font-semibold text-orange-600 bg-white border border-orange-200 rounded-full px-2.5 py-0.5">
                  +₹{state.extraStreetFoodItems.length * EXTRA_STREET_PRICE}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableStreetFoodAddons.map(item => {
                const selected = state.extraStreetFoodItems.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleExtraStreetFood(item)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      selected
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    {selected ? <X size={11} /> : <span className="font-bold">+</span>}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitesCustomizer;
