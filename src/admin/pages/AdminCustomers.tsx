import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, AlertCircle, Mail, Phone, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatINR, formatDate } from '../adminUtils';

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}
interface BookingRow {
  user_id: string;
  price: number | null;
  status: string | null;
}
interface OrderRow {
  user_id: string;
  total_amount: number | null;
  status: string | null;
}

interface CustomerAgg extends ProfileRow {
  bookings: number;
  orders: number;
  spend: number;
}

const AdminCustomers = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, b, o] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('bookings').select('user_id, price, status'),
        supabase.from('food_orders').select('user_id, total_amount, status'),
      ]);
      if (p.error) throw p.error;
      if (b.error) throw b.error;
      if (o.error) throw o.error;
      setProfiles((p.data as ProfileRow[]) || []);
      setBookings((b.data as BookingRow[]) || []);
      setOrders((o.data as OrderRow[]) || []);
    } catch (e: any) {
      console.error('[AdminCustomers] load error', e);
      setError(e?.message || 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const customers = useMemo<CustomerAgg[]>(() => {
    const bByUser = new Map<string, { count: number; spend: number }>();
    bookings.forEach((b) => {
      const rec = bByUser.get(b.user_id) || { count: 0, spend: 0 };
      rec.count += 1;
      if ((b.status || '').toLowerCase() !== 'cancelled') rec.spend += Number(b.price || 0);
      bByUser.set(b.user_id, rec);
    });
    const oByUser = new Map<string, { count: number; spend: number }>();
    orders.forEach((o) => {
      const rec = oByUser.get(o.user_id) || { count: 0, spend: 0 };
      rec.count += 1;
      if ((o.status || '').toLowerCase() !== 'cancelled') rec.spend += Number(o.total_amount || 0);
      oByUser.set(o.user_id, rec);
    });
    return profiles.map((p) => {
      const b = bByUser.get(p.id) || { count: 0, spend: 0 };
      const o = oByUser.get(p.id) || { count: 0, spend: 0 };
      return { ...p, bookings: b.count, orders: o.count, spend: b.spend + o.spend };
    });
  }, [profiles, bookings, orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const initials = (c: CustomerAgg) =>
    (c.full_name || c.email || '?')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? 'Loading…' : `${customers.length} registered customers`}
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

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone…"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        />
      </div>

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
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No customers match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Contact</th>
                  <th className="px-5 py-3 font-medium text-center">Bookings</th>
                  <th className="px-5 py-3 font-medium text-center">Orders</th>
                  <th className="px-5 py-3 font-medium text-right">Total spend</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials(c)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 truncate">{c.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-400 truncate md:hidden">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {c.email && (
                        <p className="text-slate-600 flex items-center gap-1.5 text-xs">
                          <Mail size={12} className="text-slate-400" /> {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="text-slate-500 flex items-center gap-1.5 text-xs mt-0.5">
                          <Phone size={12} className="text-slate-400" /> {c.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{c.bookings}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{c.orders}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700">
                      {formatINR(c.spend)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
