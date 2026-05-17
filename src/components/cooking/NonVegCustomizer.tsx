import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { NON_VEG_OPTIONS, getNonVegPrice, getRotiQty } from '../../data/cookingPlans';

export interface NonVegState {
  people: number;
  nonVegItem: string;
  extraRotisCount: number;
  addExtraNonVeg: string;
  addDal: string;
  specialRequest: string;
}

interface NonVegCustomizerProps {
  onChange: (state: NonVegState, price: number, isValid: boolean) => void;
  initialState?: Partial<NonVegState>;
}

const NonVegCustomizer = ({ onChange, initialState }: NonVegCustomizerProps) => {
  const [state, setState] = useState<NonVegState>({
    people: 2,
    nonVegItem: '',
    extraRotisCount: 0,
    addExtraNonVeg: '',
    addDal: '',
    specialRequest: '',
    ...initialState,
  });

  const basePrice = getNonVegPrice(state.people);
  const addOns =
    (state.extraRotisCount / 5) * 25 +
    (state.addExtraNonVeg ? 70 : 0) +
    (state.addDal ? 50 : 0);
  const totalPrice = basePrice + addOns;
  const isValid = !!state.nonVegItem;

  const availableExtraNonVeg = NON_VEG_OPTIONS.nonVegItems.filter(v => v !== state.nonVegItem);

  useEffect(() => {
    onChange(state, totalPrice, isValid);
  }, [state]);

  const update = (patch: Partial<NonVegState>) => setState(prev => ({ ...prev, ...patch }));

  const rotiQty = getRotiQty(state.people);

  const changeExtraRotis = (delta: number) => {
    update({ extraRotisCount: Math.max(0, state.extraRotisCount + delta * 5) });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">Number of People</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => update({ people: Math.max(1, state.people - 1) })}
            className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center justify-center transition-colors font-bold"
          >
            <Minus size={16} />
          </button>
          <div className="text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900">{state.people}</div>
            <div className="text-xs text-gray-500">{state.people === 1 ? 'person' : 'people'}</div>
          </div>
          <button
            onClick={() => update({ people: Math.min(8, state.people + 1) })}
            className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center justify-center transition-colors font-bold"
          >
            <Plus size={16} />
          </button>
          <div className="ml-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <div className="text-xs text-orange-700 font-medium">Max Roti Qty</div>
            <div className="text-base font-bold text-orange-800">{rotiQty} rotis</div>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
        <div className="flex items-start gap-3 px-4 py-3 bg-orange-50/50">
          <div className="w-20 flex-shrink-0 text-[11px] font-semibold text-orange-700 uppercase tracking-wide pt-0.5">Roti Type</div>
          <div className="text-sm text-gray-600 min-w-0">Can choose from Fulka / Paratha / Puri</div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 bg-orange-50/30">
          <div className="w-20 flex-shrink-0 text-[11px] font-semibold text-orange-700 uppercase tracking-wide pt-0.5">Rice</div>
          <div className="text-sm text-gray-600 min-w-0">Can choose from Jeera / Lemon / Tomato / Pulav / Plain</div>
        </div>
        <div className="px-4 py-3 bg-white">
          <div className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-2">
            Non-Veg Item <span className="text-red-500">*</span>
          </div>
          <select
            value={state.nonVegItem}
            onChange={e => {
              const v = e.target.value;
              update({ nonVegItem: v, addExtraNonVeg: state.addExtraNonVeg === v ? '' : state.addExtraNonVeg });
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-auto"
          >
            <option value="">Select non-veg item...</option>
            {NON_VEG_OPTIONS.nonVegItems.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Add-ons</h4>
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-gray-800">Extra Rotis</div>
                <div className="text-xs text-gray-500">Added in batches of 5 · ₹25 per 5 rotis</div>
              </div>
              <span className="text-sm font-bold text-orange-600">
                {state.extraRotisCount > 0 ? `+ ₹${(state.extraRotisCount / 5) * 25}` : '+ ₹25 / 5'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeExtraRotis(-1)}
                disabled={state.extraRotisCount === 0}
                className="w-9 h-9 rounded-full bg-white border-2 border-orange-300 text-orange-700 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-bold"
              >
                <Minus size={14} />
              </button>
              <div className="text-center min-w-[72px]">
                <div className="text-lg font-bold text-gray-900">{state.extraRotisCount}</div>
                <div className="text-[10px] text-gray-500">extra rotis</div>
              </div>
              <button
                onClick={() => changeExtraRotis(1)}
                className="w-9 h-9 rounded-full bg-white border-2 border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center justify-center transition-colors font-bold"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-gray-800">Extra Non-Veg</div>
                <div className="text-xs text-gray-500">Add a second non-veg dish</div>
              </div>
              <span className="text-sm font-bold text-orange-600">+ ₹70</span>
            </div>
            <select
              value={state.addExtraNonVeg}
              onChange={e => update({ addExtraNonVeg: e.target.value })}
              disabled={!state.nonVegItem}
              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {state.nonVegItem ? 'Select extra item (optional)' : 'Select a non-veg item first'}
              </option>
              {availableExtraNonVeg.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-gray-800">Add Dal</div>
                <div className="text-xs text-gray-500">Not in base plan · Dal Fry / Tadka / Sambhar / Plain</div>
              </div>
              <span className="text-sm font-bold text-orange-600">+ ₹50</span>
            </div>
            <select
              value={state.addDal}
              onChange={e => update({ addDal: e.target.value })}
              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white text-gray-900"
            >
              <option value="">No dal (optional)</option>
              {NON_VEG_OPTIONS.dals.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonVegCustomizer;
