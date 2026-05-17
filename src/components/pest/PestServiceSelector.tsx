import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';

export type PricingMode = 'rooms' | 'bhk';

export interface RoomConfig {
  kitchens: number;
  bathrooms: number;
  rooms: number;
}

export type BhkOption = '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK';

export interface PestServiceConfig {
  mode?: PricingMode;
  roomConfig?: RoomConfig;
  bhk?: BhkOption;
}

export interface SelectedPestService {
  id: string;
  config: PestServiceConfig;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export const PEST_ADD_ONS: AddOn[] = [
  { id: 'utensils-removal', name: 'Utensils Removal', price: 200 },
  { id: 'mosquito-control', name: 'Mosquito Control', price: 200 },
  { id: 'crawling-insects', name: 'Crawling Insects Control', price: 200 },
];

const BHK_PRICES_STANDARD: Record<BhkOption, number> = {
  '1BHK': 800,
  '2BHK': 1200,
  '3BHK': 1500,
  '4BHK': 1800,
  '5BHK': 2500,
};

const BHK_PRICES_RODENT: Record<BhkOption, number> = {
  '1BHK': 500,
  '2BHK': 800,
  '3BHK': 1000,
  '4BHK': 1200,
  '5BHK': 1500,
};

const ROOM_PRICE = 500;
const BHK_OPTIONS: BhkOption[] = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];

interface PestService {
  id: string;
  name: string;
  description: string;
  hasModeToggle: boolean;
  bhkPrices: Record<BhkOption, number>;
}

const PEST_SERVICES: PestService[] = [
  {
    id: 'cockroach',
    name: 'Cockroach Control',
    description: '2-visit spray and gel treatment to break the breeding cycle.',
    hasModeToggle: true,
    bhkPrices: BHK_PRICES_STANDARD,
  },
  {
    id: 'ant',
    name: 'Ant Control',
    description: 'Strategic bait gel in cracks and trails to eliminate colonies.',
    hasModeToggle: true,
    bhkPrices: BHK_PRICES_STANDARD,
  },
  {
    id: 'bedbug',
    name: 'Bed Bugs Control',
    description: 'High-potency spray for mattresses and furniture joints.',
    hasModeToggle: false,
    bhkPrices: BHK_PRICES_STANDARD,
  },
  {
    id: 'rodent',
    name: 'Rodent Control',
    description: 'Industrial glue boards and baiting in high-activity zones.',
    hasModeToggle: false,
    bhkPrices: BHK_PRICES_RODENT,
  },
];

export function calcServicePrice(service: PestService, config: PestServiceConfig): number {
  if (service.hasModeToggle && config.mode === 'rooms') {
    const rc = config.roomConfig ?? { kitchens: 1, bathrooms: 1, rooms: 0 };
    return (rc.kitchens + rc.bathrooms + rc.rooms) * ROOM_PRICE;
  }
  if (config.bhk) return service.bhkPrices[config.bhk];
  if (!service.hasModeToggle && config.bhk) return service.bhkPrices[config.bhk];
  // defaults
  if (service.hasModeToggle) {
    const rc = config.roomConfig ?? { kitchens: 1, bathrooms: 1, rooms: 0 };
    return (rc.kitchens + rc.bathrooms + rc.rooms) * ROOM_PRICE;
  }
  return service.bhkPrices['1BHK'];
}

function defaultConfig(service: PestService): PestServiceConfig {
  if (service.hasModeToggle) {
    return { mode: 'rooms', roomConfig: { kitchens: 1, bathrooms: 1, rooms: 0 } };
  }
  return { bhk: '1BHK' };
}

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function Stepper({ label, value, min, max, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-orange-400 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-base font-bold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border-2 border-orange-400 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
        </button>
        <span className="w-20 text-right text-sm font-semibold text-orange-600">
          ₹{(value * ROOM_PRICE).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

interface ServiceCardProps {
  service: PestService;
  selected: boolean;
  config: PestServiceConfig;
  onToggle: () => void;
  onConfigChange: (c: PestServiceConfig) => void;
}

function ServiceCard({ service, selected, config, onToggle, onConfigChange }: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const price = calcServicePrice(service, config);
  const mode = config.mode ?? (service.hasModeToggle ? 'rooms' : undefined);
  const rc = config.roomConfig ?? { kitchens: 1, bathrooms: 1, rooms: 0 };

  const handleSelect = () => {
    onToggle();
    if (!selected) setExpanded(true);
    else setExpanded(false);
  };

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        selected
          ? 'border-orange-400 shadow-md shadow-orange-100'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Card header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={handleSelect}
      >
        {/* Checkbox */}
        <div
          className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
          }`}
        >
          {selected && <Check size={12} className="text-white" strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{service.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{service.description}</p>
        </div>

        {selected && (
          <div className="text-right mr-2 flex-shrink-0">
            <span className="text-base font-bold text-orange-600">₹{price.toLocaleString()}</span>
          </div>
        )}

        {selected && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
          </button>
        )}
      </div>

      {/* Inline config panel */}
      {selected && expanded && (
        <div className="border-t border-orange-100 bg-orange-50/40 px-4 pb-4 pt-3">
          {service.hasModeToggle && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-gray-600 mr-1">Pricing by:</span>
              <button
                type="button"
                onClick={() => onConfigChange({ ...config, mode: 'rooms', roomConfig: { kitchens: 1, bathrooms: 1, rooms: 0 } })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'rooms'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-orange-300'
                }`}
              >
                Room / Kitchen
              </button>
              <button
                type="button"
                onClick={() => onConfigChange({ ...config, mode: 'bhk', bhk: config.bhk ?? '1BHK' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'bhk'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-orange-300'
                }`}
              >
                House Type (BHK)
              </button>
            </div>
          )}

          {/* Room/Kitchen steppers */}
          {(service.hasModeToggle ? mode === 'rooms' : false) && (
            <div className="bg-white rounded-xl border border-orange-200 px-4 py-1 mb-2">
              <Stepper
                label="Kitchens"
                value={rc.kitchens}
                min={0} max={10}
                onChange={(v) => onConfigChange({ ...config, roomConfig: { ...rc, kitchens: v } })}
              />
              <Stepper
                label="Bathrooms"
                value={rc.bathrooms}
                min={0} max={10}
                onChange={(v) => onConfigChange({ ...config, roomConfig: { ...rc, bathrooms: v } })}
              />
              <Stepper
                label="Rooms"
                value={rc.rooms}
                min={0} max={10}
                onChange={(v) => onConfigChange({ ...config, roomConfig: { ...rc, rooms: v } })}
              />
            </div>
          )}

          {/* BHK selector */}
          {(!service.hasModeToggle || mode === 'bhk') && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Select house size</p>
              <div className="flex flex-wrap gap-2">
                {BHK_OPTIONS.map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => onConfigChange({ ...config, bhk })}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      config.bhk === bhk
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <div>{bhk}</div>
                    <div className={`text-[10px] mt-0.5 font-semibold ${config.bhk === bhk ? 'text-orange-100' : 'text-orange-500'}`}>
                      ₹{service.bhkPrices[bhk]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex justify-between items-center pt-2 border-t border-orange-200">
            <span className="text-xs text-gray-500 font-medium">Subtotal for {service.name}</span>
            <span className="text-sm font-bold text-orange-600">₹{price.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  selectedServices: SelectedPestService[];
  selectedAddOns: string[];
  onServicesChange: (services: SelectedPestService[]) => void;
  onAddOnsChange: (addOns: string[]) => void;
}

export default function PestServiceSelector({ selectedServices, selectedAddOns, onServicesChange, onAddOnsChange }: Props) {
  const isSelected = (id: string) => selectedServices.some(s => s.id === id);

  const getConfig = (id: string): PestServiceConfig => {
    const found = selectedServices.find(s => s.id === id);
    if (found) return found.config;
    const svc = PEST_SERVICES.find(s => s.id === id)!;
    return defaultConfig(svc);
  };

  const toggleService = (id: string) => {
    if (isSelected(id)) {
      const next = selectedServices.filter(s => s.id !== id);
      onServicesChange(next);
      if (next.length === 0) onAddOnsChange([]);
    } else {
      const svc = PEST_SERVICES.find(s => s.id === id)!;
      onServicesChange([...selectedServices, { id, config: defaultConfig(svc) }]);
    }
  };

  const updateConfig = (id: string, config: PestServiceConfig) => {
    onServicesChange(
      selectedServices.map(s => s.id === id ? { ...s, config } : s)
    );
  };

  const toggleAddOn = (id: string) => {
    if (selectedAddOns.includes(id)) {
      onAddOnsChange(selectedAddOns.filter(a => a !== id));
    } else {
      onAddOnsChange([...selectedAddOns, id]);
    }
  };

  const addOnsTotal = selectedAddOns.reduce((sum, id) => {
    const ao = PEST_ADD_ONS.find(a => a.id === id);
    return sum + (ao?.price ?? 0);
  }, 0);

  const servicesTotal = selectedServices.reduce((sum, s) => {
    const svc = PEST_SERVICES.find(p => p.id === s.id)!;
    return sum + calcServicePrice(svc, s.config);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Services */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Select Services <span className="text-red-500">*</span>
        </h3>
        <p className="text-xs text-gray-500 mb-3">Choose one or more treatments. Each can be customised independently.</p>
        <div className="space-y-3">
          {PEST_SERVICES.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              selected={isSelected(svc.id)}
              config={getConfig(svc.id)}
              onToggle={() => toggleService(svc.id)}
              onConfigChange={(c) => updateConfig(svc.id, c)}
            />
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <h3 className={`text-base font-bold mb-1 ${selectedServices.length === 0 ? 'text-gray-400' : 'text-gray-900'}`}>Add-Ons</h3>
        <p className={`text-xs mb-3 ${selectedServices.length === 0 ? 'text-gray-400' : 'text-gray-500'}`}>
          {selectedServices.length === 0
            ? 'Select at least one treatment above to unlock add-ons.'
            : 'Optional extras — ₹200 each, charged once regardless of services selected.'}
        </p>
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity duration-200 ${selectedServices.length === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
          {PEST_ADD_ONS.map((ao) => {
            const active = selectedAddOns.includes(ao.id);
            return (
              <button
                key={ao.id}
                type="button"
                onClick={() => toggleAddOn(ao.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-orange-400 bg-orange-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    active ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                  }`}
                >
                  {active && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{ao.name}</p>
                  <p className="text-xs text-orange-600 font-bold mt-0.5">₹{ao.price}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Running subtotal */}
      {(selectedServices.length > 0 || selectedAddOns.length > 0) && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
          {selectedServices.map((s) => {
            const svc = PEST_SERVICES.find(p => p.id === s.id)!;
            return (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{svc.name}</span>
                <span className="font-semibold text-gray-900">₹{calcServicePrice(svc, s.config).toLocaleString()}</span>
              </div>
            );
          })}
          {selectedAddOns.map((id) => {
            const ao = PEST_ADD_ONS.find(a => a.id === id)!;
            return (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-gray-500">{ao.name} <span className="text-xs">(Add-On)</span></span>
                <span className="font-semibold text-gray-900">₹{ao.price}</span>
              </div>
            );
          })}
          {(selectedServices.length > 0 || selectedAddOns.length > 0) && (
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">Subtotal</span>
              <span className="font-bold text-orange-600">₹{(servicesTotal + addOnsTotal).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { PEST_SERVICES, calcServicePrice as calcPestServicePrice };
