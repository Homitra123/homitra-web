import { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Banknote,
  CalendarCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatINR, isToday } from '../adminUtils';

interface BookingRow {
  price: number | null;
  status: string | null;
  service_name: string | null;
  payment_id: string | null;
  created_at: string;
}
interface OrderRow {
  total_amount: number | null;
  status: string | null;
  payment_method: string | null;
  created_at: string;
}

const isThisMonth = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
};

const AdminFinance = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, o] = await Promise.all([
        supabase
          .from('bookings')
          .select('price, status, service_name, payment_id, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('food_orders')
          .select('total_amount, status, payment_method, created_at')
          .order('created_at', { ascending: false }),
      ]);
      if (b.error) throw b.error;
      if (o.error) throw o.error;
      setBookings((b.data as BookingRow[]) || []);
      setOrders((o.data as OrderRow[]) || []);
    } catch (e: any) {
      console.error('[AdminFinance] load error', e);
      setError(e?.message || 'Could not load finance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const f = useMemo(() => {
    const liveB = bookings.filter((b) => (b.status || '').toLowerCase() !== 'cancelled');
    const liveO = orders.filter((o) => (o.status || '').toLowerCase() !== 'cancelled');

    const bookingRev = liveB.reduce((s, b) => s + Number(b.price || 0), 0);
    const orderRev = liveO.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const gross = bookingRev + orderRev;

    const monthRev =
      liveB.filter((b) => isThisMonth(b.created_at)).reduce((s, b) => s + Number(b.price || 0), 0) +
      liveO.filter((o) => isThisMonth(o.created_at)).reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const todayRev =
      liveB.filter((b) => isToday(b.created_at)).reduce((s, b) => s + Number(b.price || 0), 0) +
      liveO.filter((o) => isToday(o.created_at)).reduce((s, o) => s + Number(o.total_amount || 0), 0);

    const txns = liveB.length + liveO.length;
    const avg = txns ? Math.round(gross / txns) : 0;

    // Online vs cash: food orders use payment_method; bookings inferred by payment_id
    const onlineRev =
      liveO.filter((o) => (o.payment_method || '').toLowerCase() === 'online').reduce((s, o) => s + Number(o.total_amount || 0), 0) +
      liveB.filter((b) => !!b.payment_id).reduce((s, b) => s + Number(b.price || 0), 0);
    const codRev =
      liveO.filter((o) => (o.payment_method || '').toLowerCase() !== 'online').reduce((s, o) => s + Number(o.total_amount || 0), 0) +
      liveB.filter((b) => !b.payment_id).reduce((s, b) => s + Number(b.price || 0), 0);

    // Revenue by service (bookings) + a "Food orders" bucket
    const byService = new Map<string, number>();
    liveB.forEach((b) => {
      const k = b.service_name || 'Other service';
      byService.set(k, (byService.get(k) || 0) + Number(b.price || 0));
    });
    if (orderRev > 0) byService.set('Food orders', orderRev);
    const topServices = [...byService.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Monthly revenue, last 6 months
    const months: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      d.setMonth(d.getMonth() - i);
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      const within = (iso: string) => {
        const t = new Date(iso).getTime();
        return t >= d.getTime() && t < next.getTime();
      };
      const total =
        liveB.filter((b) => within(b.created_at)).reduce((s, b) => s + Number(b.price || 0), 0) +
        liveO.filter((o) => within(o.created_at)).reduce((s, o) => s + Number(o.total_amount || 0), 0);
      months.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), total });
    }

    return {
      gross,
      monthRev,
      todayRev,
      avg,
      txns,
      bookingRev,
      orderRev,
      onlineRev,
      codRev,
      topServices,
      months,
      cancelledCount: bookings.length - liveB.length + (orders.length - liveO.length),
    };
  }, [bookings, orders]);

  const maxMonth = Math.max(1, ...f.months.map((m) => m.total));
  const pct = (part: number) => (f.gross > 0 ? Math.round((part / f.gross) * 100) : 0);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl border border-rose-200 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Couldn't load finance</h2>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
        <button
          onClick={load}
          className="mt-5 inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  const kpis = [
    { label: 'Gross revenue', value: formatINR(f.gross), sub: 'All time · excludes cancelled', icon: Wallet, accent: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'This month', value: formatINR(f.monthRev), sub: formatINR(f.todayRev) + ' today', icon: TrendingUp, accent: 'bg-sky-500/10 text-sky-600' },
    { label: 'Avg. order value', value: formatINR(f.avg), sub: `${f.txns} paid transactions`, icon: CreditCard, accent: 'bg-violet-500/10 text-violet-600' },
    { label: 'Cancelled', value: String(f.cancelledCount), sub: 'Not counted in revenue', icon: AlertCircle, accent: 'bg-rose-500/10 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Revenue, payment mix, and monthly trend.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.accent}`}>
                <Icon size={20} />
              </span>
              <p className="text-slate-500 text-sm mt-4">{k.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">
                {loading ? <span className="inline-block h-7 w-24 bg-slate-100 rounded animate-pulse" /> : k.value}
              </p>
              <p className="text-xs text-slate-400 mt-1">{loading ? '' : k.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-5">
            <TrendingUp size={17} className="text-sky-500" /> Monthly revenue — last 6 months
          </h2>
          <div className="flex items-end justify-between gap-3 h-44">
            {f.months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  {m.total > 0 ? formatINR(m.total) : ''}
                </span>
                <div className="w-full flex items-end justify-center flex-1">
                  <div
                    className="w-full max-w-[46px] rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400"
                    style={{ height: `${(m.total / maxMonth) * 100}%`, minHeight: m.total > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment mix */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Payment mix</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2 text-slate-600">
                  <CreditCard size={15} className="text-sky-500" /> Online
                </span>
                <span className="font-semibold text-slate-700">{formatINR(f.onlineRev)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${pct(f.onlineRev)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2 text-slate-600">
                  <Banknote size={15} className="text-emerald-500" /> Cash / on delivery
                </span>
                <span className="font-semibold text-slate-700">{formatINR(f.codRev)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${pct(f.codRev)}%` }} />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <CalendarCheck size={15} className="text-sky-500" /> Service bookings
                </span>
                <span className="font-semibold text-slate-700">{formatINR(f.bookingRev)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <UtensilsCrossed size={15} className="text-orange-500" /> Food orders
                </span>
                <span className="font-semibold text-slate-700">{formatINR(f.orderRev)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by service */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Revenue by service</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : f.topServices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No revenue recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {f.topServices.map(([name, amount]) => (
              <div key={name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">{name}</span>
                  <span className="font-medium text-slate-700">
                    {formatINR(amount)} <span className="text-slate-400">· {pct(amount)}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-sky-400"
                    style={{ width: `${f.gross > 0 ? (amount / f.gross) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Figures are based on orders recorded in the app (cancelled excluded). Refunds are managed in Razorpay and are not
        reflected here.
      </p>
    </div>
  );
};

export default AdminFinance;
