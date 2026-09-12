import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CalendarCheck,
  UtensilsCrossed,
  Users,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  formatINR,
  timeAgo,
  isToday,
  statusStyle,
  OPEN_BOOKING_STATUSES,
  OPEN_ORDER_STATUSES,
} from '../adminUtils';

interface BookingRow {
  id: string;
  service_name: string | null;
  tier: string | null;
  price: number | null;
  status: string | null;
  created_at: string;
  user_id: string;
}
interface OrderRow {
  id: string;
  total_amount: number | null;
  status: string | null;
  payment_method: string | null;
  created_at: string;
  user_id: string;
}
interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

const AdminHome = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, o, p] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, service_name, tier, price, status, created_at, user_id')
          .order('created_at', { ascending: false }),
        supabase
          .from('food_orders')
          .select('id, total_amount, status, payment_method, created_at, user_id')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .order('created_at', { ascending: false }),
      ]);
      if (b.error) throw b.error;
      if (o.error) throw o.error;
      if (p.error) throw p.error;
      setBookings((b.data as BookingRow[]) || []);
      setOrders((o.data as OrderRow[]) || []);
      setProfiles((p.data as ProfileRow[]) || []);
    } catch (e: any) {
      console.error('[AdminHome] load error', e);
      setError(e?.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const profileMap = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const stats = useMemo(() => {
    const liveBookings = bookings.filter((b) => (b.status || '').toLowerCase() !== 'cancelled');
    const liveOrders = orders.filter((o) => (o.status || '').toLowerCase() !== 'cancelled');

    const bookingRevenue = liveBookings.reduce((s, b) => s + Number(b.price || 0), 0);
    const orderRevenue = liveOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

    const todayBookingRevenue = liveBookings
      .filter((b) => isToday(b.created_at))
      .reduce((s, b) => s + Number(b.price || 0), 0);
    const todayOrderRevenue = liveOrders
      .filter((o) => isToday(o.created_at))
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);

    const openBookings = bookings.filter((b) =>
      OPEN_BOOKING_STATUSES.includes((b.status || '').toLowerCase())
    ).length;
    const openOrders = orders.filter((o) =>
      OPEN_ORDER_STATUSES.includes((o.status || '').toLowerCase())
    ).length;

    return {
      totalRevenue: bookingRevenue + orderRevenue,
      todayRevenue: todayBookingRevenue + todayOrderRevenue,
      totalBookings: bookings.length,
      todayBookings: bookings.filter((b) => isToday(b.created_at)).length,
      totalOrders: orders.length,
      todayOrders: orders.filter((o) => isToday(o.created_at)).length,
      totalCustomers: profiles.length,
      todayCustomers: profiles.filter((p) => isToday(p.created_at)).length,
      openBookings,
      openOrders,
    };
  }, [bookings, orders, profiles]);

  // 7-day revenue trend (non-cancelled)
  const trend = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const within = (iso: string) => {
        const t = new Date(iso).getTime();
        return t >= d.getTime() && t < next.getTime();
      };
      const bTotal = bookings
        .filter((b) => (b.status || '').toLowerCase() !== 'cancelled' && within(b.created_at))
        .reduce((s, b) => s + Number(b.price || 0), 0);
      const oTotal = orders
        .filter((o) => (o.status || '').toLowerCase() !== 'cancelled' && within(o.created_at))
        .reduce((s, o) => s + Number(o.total_amount || 0), 0);
      days.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        total: bTotal + oTotal,
      });
    }
    return days;
  }, [bookings, orders]);

  const maxTrend = Math.max(1, ...trend.map((d) => d.total));

  // Recent activity: merge latest bookings + orders
  const recent = useMemo(() => {
    const items = [
      ...bookings.map((b) => ({
        kind: 'booking' as const,
        id: b.id,
        title: b.service_name || 'Service booking',
        sub: b.tier || '',
        amount: Number(b.price || 0),
        status: b.status,
        created_at: b.created_at,
        user_id: b.user_id,
      })),
      ...orders.map((o) => ({
        kind: 'order' as const,
        id: o.id,
        title: 'Food order',
        sub: (o.payment_method || '').toUpperCase(),
        amount: Number(o.total_amount || 0),
        status: o.status,
        created_at: o.created_at,
        user_id: o.user_id,
      })),
    ];
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items.slice(0, 8);
  }, [bookings, orders]);

  const greeting = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';

  const kpis = [
    {
      label: 'Total revenue',
      value: formatINR(stats.totalRevenue),
      delta: `${formatINR(stats.todayRevenue)} today`,
      icon: Wallet,
      accent: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Service bookings',
      value: stats.totalBookings.toLocaleString('en-IN'),
      delta: `${stats.todayBookings} today`,
      icon: CalendarCheck,
      accent: 'bg-sky-500/10 text-sky-600',
    },
    {
      label: 'Food orders',
      value: stats.totalOrders.toLocaleString('en-IN'),
      delta: `${stats.todayOrders} today`,
      icon: UtensilsCrossed,
      accent: 'bg-orange-500/10 text-orange-600',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers.toLocaleString('en-IN'),
      delta: `${stats.todayCustomers} new today`,
      icon: Users,
      accent: 'bg-violet-500/10 text-violet-600',
    },
  ];

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl border border-rose-200 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Couldn't load the dashboard</h2>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {greeting}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here's how Homitra is doing today —{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.accent}`}>
                  <Icon size={20} />
                </span>
                <ArrowUpRight size={16} className="text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm mt-4">{k.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">
                {loading ? (
                  <span className="inline-block h-7 w-24 bg-slate-100 rounded animate-pulse" />
                ) : (
                  k.value
                )}
              </p>
              <p className="text-xs text-slate-400 mt-1">{loading ? '' : k.delta}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp size={17} className="text-sky-500" /> Revenue — last 7 days
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bookings + food orders (excludes cancelled)
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {trend.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    className="w-full max-w-[38px] rounded-t-md bg-gradient-to-t from-sky-500 to-sky-400 transition-all"
                    style={{
                      height: `${(d.total / maxTrend) * 100}%`,
                      minHeight: d.total > 0 ? 4 : 0,
                    }}
                    title={formatINR(d.total)}
                  />
                </div>
                <span className="text-[11px] text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs attention */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <AlertCircle size={17} className="text-amber-500" /> Needs attention
          </h2>
          <div className="space-y-3">
            <Link
              to="/admin/orders"
              className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 hover:bg-amber-50 border border-amber-100 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">Open bookings</p>
                <p className="text-xs text-slate-400">Awaiting action</p>
              </div>
              <span className="text-xl font-bold text-amber-600">
                {loading ? '—' : stats.openBookings}
              </span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center justify-between p-3 rounded-xl bg-sky-50/60 hover:bg-sky-50 border border-sky-100 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">Open food orders</p>
                <p className="text-xs text-slate-400">To prepare / deliver</p>
              </div>
              <span className="text-xl font-bold text-sky-600">
                {loading ? '—' : stats.openOrders}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Recent activity</h2>
          <Link to="/admin/orders" className="text-sm text-sky-600 font-medium hover:text-sky-700">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No activity yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((r) => {
              const cust = profileMap.get(r.user_id);
              const st = statusStyle(r.status);
              return (
                <div key={`${r.kind}-${r.id}`} className="flex items-center gap-3 py-3">
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      r.kind === 'booking'
                        ? 'bg-sky-500/10 text-sky-600'
                        : 'bg-orange-500/10 text-orange-600'
                    }`}
                  >
                    {r.kind === 'booking' ? (
                      <CalendarCheck size={17} />
                    ) : (
                      <UtensilsCrossed size={17} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {r.title}
                      {r.sub ? <span className="text-slate-400 font-normal"> · {r.sub}</span> : null}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {cust?.full_name || cust?.email || 'Customer'} · {timeAgo(r.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{formatINR(r.amount)}</p>
                    <span
                      className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${st.classes}`}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
