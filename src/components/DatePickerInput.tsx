import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerInputProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DatePickerInput({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select a date',
  className = '',
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const initDate = value ? parseLocalDate(value) : today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value) {
      const d = parseLocalDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const minD = minDate ? parseLocalDate(minDate) : null;
  const maxD = maxDate ? parseLocalDate(maxDate) : null;

  const isDisabled = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (minD) {
      const min = new Date(minD.getFullYear(), minD.getMonth(), minD.getDate());
      if (d < min) return true;
    }
    if (maxD) {
      const max = new Date(maxD.getFullYear(), maxD.getMonth(), maxD.getDate());
      if (d > max) return true;
    }
    return false;
  };

  const isSelected = (date: Date) => value === toDateString(date);

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const canGoPrev = () => {
    if (!minD) return true;
    return viewYear > minD.getFullYear() || (viewYear === minD.getFullYear() && viewMonth > minD.getMonth());
  };

  const canGoNext = () => {
    if (!maxD) return true;
    return viewYear < maxD.getFullYear() || (viewYear === maxD.getFullYear() && viewMonth < maxD.getMonth());
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayClick = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (isDisabled(date)) return;
    onChange(toDateString(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none cursor-pointer flex items-center justify-between bg-white hover:border-blue-400 transition-colors select-none"
      >
        <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={18} className="text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev()}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-gray-900 text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext()}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const date = new Date(viewYear, viewMonth, day);
              const disabled = isDisabled(date);
              const selected = isSelected(date);
              const todayDay = isToday(date);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(day)}
                  className={`h-8 w-8 mx-auto rounded-full text-sm font-medium transition-all flex items-center justify-center ${
                    selected
                      ? 'bg-blue-600 text-white shadow-md'
                      : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : todayDay
                      ? 'bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-400'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const t = toDateString(today);
                if (!isDisabled(today)) {
                  onChange(t);
                  setOpen(false);
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
