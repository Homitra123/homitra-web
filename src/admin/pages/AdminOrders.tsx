import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  AlertCircle,
  X,
  CalendarCheck,
  UtensilsCrossed,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatINR, formatDateTime, statusStyle } from '../adminUtils';

interface BookingRow {
  id: string;
  service_name: string | null;
  tier: string | null;
  booking_mode: string | null;
  duration: string | null;
  date: string | null;
  time_slot: string | null;
  location: string | null;
  address: string | null;
  price: number | null;
  visits: number | null;
  status: string | null;
  partner_name: string | null;
  created_at: string;
  user_id: string;
}
interface OrderRow {
  id: string;
  location: string | null;
  address: string | null;
  special_instructions: string | null;
  subtotal: number | null;
  total_amount: number | null;
  payment_method: string | null;
  payment_id: string | null;
  status: string | null;
  created_at: string;
  user_id: string;
}
interface OrderItem {
  id: string;
  item_name: string;
  item_category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_veg: boolean;
}
interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

type Tab = 'bookings' | 'orders';

const AdminOrders = () => {
  const [tab, setTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [detail, setDetail] = useState<
    | { kind: 'booking'; row: BookingRow }
    | { kind: 'order'; row: OrderRow; items: OrderItem[]; itemsLoading: boolean }
    | null
  >(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, o, p] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('food_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email, phone'),
      ]);
      if (b.error) throw b.error;
      if (o.error) throw o.error;
      if (p.error) throw p.error;
      setBookings((b.data as BookingRow[]) || []);
      setOrders((o.data as OrderRow[]) || []);
      setProfiles((p.data as ProfileRow[]) || []);
    } catch (e: any) {
      console.error('[AdminOrders] load error', e);
      setError(e?.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // reset filters when switching tabs
  useEffect(() => {
    setStatusFilter('all');
    setSearch('');
  }, [tab]);

  const profileMap = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const custLabel = (uid: string) => {
    const p = profileMap.get(uid);
    return p?.full_name || p?.email || 'Customer';
  };

  const statusOptions = useMemo(() => {
    const rows = tab === 'bookings' ? bookings : orders;
    const set = new Set<string>();
    rows.forEach((r) => r.status && set.add(r.status.toLowerCase()));
    return ['all', ...Array.from(set)];
  }, [tab, bookings, orders]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && (b.status || '').toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      const p = profileMap.get(b.user_id);
      return (
        (b.service_name || '').toLowerCase().includes(q) ||
        (b.location || '').toLowerCase().includes(q) ||
        (p?.full_name || '').toLowerCase().includes(q) ||
        (p?.email || '').toLowerCase().includes(q) ||
        (p?.phone || '').toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, search, profileMap]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && (o.status || '').toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      const p = profileMap.get(o.user_id);
      return (
        (o.location || '').toLowerCase().includes(q) ||
        (o.payment_method || '').toLowerCase().includes(q) ||
        (p?.full_name || '').toLowerCase().includes(q) ||
        (p?.email || '').toLowerCase().includes(q) ||
        (p?.phone || '').toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, search, profileMap]);

  const openOrderDetail = async (row: OrderRow) => {
    setDetail({ kind: 'order', row, items: [], itemsLoading: true });
    const { data, error: itemErr } = await supabase
      .from('food_order_items')
      .select('id, item_name, item_category, quantity, unit_price, total_price, is_veg')
      .eq('order_id', row.id);
    if (itemErr) console.error('[AdminOrders] items error', itemErr);
    setDetail({ kind: 'order', row, items: (data as OrderItem[]) || [], itemsLoading: false });
  };

  const count = tab === 'bookings' ? filteredBookings.length : filteredOrders.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders &amp; Bookings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Every service booking and food order in one place.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
        {(['bookings', 'orders'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'bookings' ? <CalendarCheck size={16} /> : <UtensilsCrossed size={16} />}
            {t === 'bookings' ? 'Service bookings' : 'Food orders'}
            <span className="text-xs text-slate-400">
              ({t === 'bookings' ? bookings.length : orders.length})
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, service, area, phone…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2.5 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Table / states */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <AlertCircle className="h-7 w-7 text-rose-500 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">{error}</p>
            <button
              onClick={load}
              className="mt-4 inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No {tab === 'bookings' ? 'bookings' : 'orders'} match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">
                    {tab === 'bookings' ? 'Service' : 'Order'}
                  </th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Area</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Placed</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tab === 'bookings'
                  ? filteredBookings.map((b) => {
                      const st = statusStyle(b.status);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => setDetail({ kind: 'booking', row: b })}
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-700">{custLabel(b.user_id)}</td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {b.service_name || '—'}
                            {b.tier ? <span className="text-slate-400"> · {b.tier}</span> : null}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">
                            {b.location || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                            {formatDateTime(b.created_at)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-700">
                            {formatINR(b.price)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${st.classes}`}
                            >
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  : filteredOrders.map((o) => {
                      const st = statusStyle(o.status);
                      return (
                        <tr
                          key={o.id}
                          onClick={() => openOrderDetail(o)}
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-700">{custLabel(o.user_id)}</td>
                          <td className="px-5 py-3.5 text-slate-600">
                            #{o.id.slice(0, 8)}
                            <span className="text-slate-400"> · {(o.payment_method || '').toUpperCase()}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">
                            {o.location || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                            {formatDateTime(o.created_at)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-700">
                            {formatINR(o.total_amount)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${st.classes}`}
                            >
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && count > 0 && (
        <p className="text-xs text-slate-400">Showing {count} {tab === 'bookings' ? 'bookings' : 'orders'}.</p>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <div
            className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {detail.kind === 'booking' ? (
                  <CalendarCheck size={18} className="text-sky-600" />
                ) : (
                  <UtensilsCrossed size={18} className="text-orange-600" />
                )}
                <h3 className="font-semibold text-slate-800">
                  {detail.kind === 'booking' ? 'Booking details' : 'Order details'}
                </h3>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Customer block */}
              {(() => {
                const uid = detail.row.user_id;
                const p = profileMap.get(uid);
                return (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-800">{p?.full_name || 'Customer'}</p>
                    {p?.email && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                        <Mail size={13} /> {p.email}
                      </p>
                    )}
                    {p?.phone && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone size={13} /> {p.phone}
                      </p>
                    )}
                  </div>
                );
              })()}

              {detail.kind === 'booking' ? (
                <div className="space-y-3">
                  <Field label="Service" value={`${detail.row.service_name || '—'}${detail.row.tier ? ' · ' + detail.row.tier : ''}`} />
                  <Field label="Mode" value={detail.row.booking_mode || '—'} />
                  <Field label="Duration" value={detail.row.duration || '—'} />
                  <Field label="Date" value={detail.row.date || '—'} />
                  <Field label="Time slot" value={detail.row.time_slot || '—'} />
                  <Field label="Visits" value={String(detail.row.visits ?? '—')} />
                  {detail.row.partner_name && (
                    <Field label="Partner" value={detail.row.partner_name} />
                  )}
                  <div>
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin size={12} /> Address
                    </p>
                    <p className="text-sm text-slate-700">
                      {detail.row.address || '—'}
                      {detail.row.location ? `, ${detail.row.location}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Items</p>
                    {detail.itemsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : detail.items.length === 0 ? (
                      <p className="text-sm text-slate-400">No item records.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
                          >
                            <span className="flex items-center gap-2 text-slate-700">
                              <span
                                className={`w-2 h-2 rounded-full ${it.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              />
                              {it.quantity}× {it.item_name}
                            </span>
                            <span className="font-medium text-slate-700">{formatINR(it.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatINR(detail.row.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-slate-800">
                      <span>Total</span>
                      <span>{formatINR(detail.row.total_amount)}</span>
                    </div>
                  </div>
                  <Field label="Payment" value={(detail.row.payment_method || '—').toUpperCase()} />
                  {detail.row.special_instructions && (
                    <Field label="Notes" value={detail.row.special_instructions} />
                  )}
                  <div>
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin size={12} /> Delivery address
                    </p>
                    <p className="text-sm text-slate-700">
                      {detail.row.address || '—'}
                      {detail.row.location ? `, ${detail.row.location}` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">{formatDateTime(detail.row.created_at)}</span>
                <span
                  className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${
                    statusStyle(detail.row.status).classes
                  }`}
                >
                  {statusStyle(detail.row.status).label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs text-slate-400 pt-0.5">{label}</span>
    <span className="text-sm text-slate-700 text-right">{value}</span>
  </div>
);

export default AdminOrders;
