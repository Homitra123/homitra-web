import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, MapPin, Clock, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ESTIMATED_DELIVERY_MINUTES } from '../data/menuData';

interface OrderDetails {
  id: string;
  address: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: { item_name: string; quantity: number; total_price: number; is_veg: boolean }[];
}

const FoodOrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = (location.state as { orderId?: string })?.orderId;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/cloud-kitchen', { replace: true });
      return;
    }
    const load = async () => {
      try {
        const { data: orderData } = await supabase
          .from('food_orders')
          .select('id, address, total_amount, status, created_at')
          .eq('id', orderId)
          .maybeSingle();

        const { data: itemData } = await supabase
          .from('food_order_items')
          .select('item_name, quantity, total_price, is_veg')
          .eq('order_id', orderId);

        if (orderData) {
          setOrder({ ...orderData, items: itemData ?? [] });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <UtensilsCrossed size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <Link to="/food-orders" className="text-blue-600 hover:underline text-sm">View all orders</Link>
        </div>
      </div>
    );
  }

  const orderRef = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 text-center border-b border-green-100">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <CheckCircle size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-600">Your food is being prepared and will arrive soon</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Order ref + status */}
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-5 py-4">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-0.5">Order ID</p>
              <p className="font-bold text-blue-900">#{orderRef}</p>
            </div>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              Confirmed
            </span>
          </div>

          {/* Estimated delivery */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
            <Clock size={20} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Estimated delivery time</p>
              <p className="text-sm text-amber-700">{ESTIMATED_DELIVERY_MINUTES} – {ESTIMATED_DELIVERY_MINUTES + 15} minutes</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ShoppingBag size={14} />
              Your Order
            </h2>
            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${it.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                    <span className="text-gray-900 font-medium">{it.item_name}</span>
                    <span className="text-gray-400">×{it.quantity}</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{it.total_price}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
              <span className="font-bold text-gray-900">Total Paid (COD)</span>
              <span className="text-xl font-bold text-blue-600">₹{order.total_amount}</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p>{order.address}</p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/food-orders"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/20 text-sm"
            >
              <span>Track My Orders</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/cloud-kitchen"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3.5 rounded-xl font-semibold transition-colors text-center text-sm"
            >
              Order Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodOrderSuccess;
