import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, MapPin, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface FoodOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_veg: boolean;
  item_category: string;
}

interface FoodOrder {
  id: string;
  address: string;
  location: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  special_instructions: string;
  estimated_delivery_minutes: number;
  created_at: string;
  items?: FoodOrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

const FoodOrderCard = ({ order }: { order: FoodOrder }) => {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<FoodOrderItem[]>(order.items ?? []);
  const [loadingItems, setLoadingItems] = useState(false);

  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
  const orderRef = order.id.slice(0, 8).toUpperCase();

  const handleExpand = async () => {
    if (!expanded && items.length === 0) {
      setLoadingItems(true);
      const { data } = await supabase
        .from('food_order_items')
        .select('*')
        .eq('order_id', order.id);
      setItems(data ?? []);
      setLoadingItems(false);
    }
    setExpanded(v => !v);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-900 text-base">Order #{orderRef}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">₹{order.total_amount}</p>
            <p className="text-xs text-gray-500 capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{order.address}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock size={13} />
            <span>{order.estimated_delivery_minutes} min est. delivery</span>
          </div>
          <button
            onClick={handleExpand}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {expanded ? 'Hide items' : 'View items'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 md:px-6 py-4 bg-gray-50">
          {loadingItems ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Loading...
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No item details available.</p>
          ) : (
            <div className="space-y-2">
              {items.map(it => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${it.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                    <span className="text-gray-800 font-medium">{it.item_name}</span>
                    <span className="text-gray-400 text-xs">×{it.quantity}</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{it.total_price}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1 border-t border-gray-200 text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-blue-600">₹{order.total_amount}</span>
              </div>
              {order.special_instructions && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Note: </span>
                    {order.special_instructions}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FoodOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    setContentLoading(true);
    setError(false);
    try {
      const { data, error: fetchError } = await supabase
        .from('food_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data ?? []);
    } catch {
      setError(true);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Food Orders</h1>
          <p className="text-gray-600 text-lg">Track and view your kitchen orders</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={contentLoading}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={contentLoading ? 'animate-spin' : ''} />
          <span className="text-sm font-medium hidden md:block">Refresh</span>
        </button>
      </div>

      {(contentLoading || authLoading) ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <p className="text-gray-600 text-sm">Loading orders...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <UtensilsCrossed size={40} className="text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Orders</h2>
          <button onClick={fetchOrders} className="bg-blue-600 text-white py-2.5 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm mt-4">
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <UtensilsCrossed size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No food orders yet</h3>
          <p className="text-gray-500 mb-6">Your kitchen orders will appear here once you place one.</p>
          <Link
            to="/cloud-kitchen"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <FoodOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodOrders;
