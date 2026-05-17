import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, FileText, ShoppingBag, Truck, Leaf, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase, getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';
import { DELIVERY_FEE, MIN_ORDER_AMOUNT } from '../data/menuData';
import { BANGALORE_LOCATIONS as LOCATION_OPTIONS } from '../types/index';

const VegDot = ({ isVeg }: { isVeg: boolean }) => (
  <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
);

const FoodCheckout = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [location, setLocation] = useState(profile?.location ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod] = useState<'cod'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = subtotal + DELIVERY_FEE;

  if (items.length === 0) {
    navigate('/cloud-kitchen');
    return null;
  }

  if (subtotal < MIN_ORDER_AMOUNT) {
    navigate('/cloud-kitchen');
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (!location) { setError('Please select your delivery area.'); return; }
    if (!address.trim()) { setError('Please enter your delivery address.'); return; }

    setError('');
    setSubmitting(true);

    try {
      // 1. Insert food_order
      const { data: orderData, error: orderError } = await supabase
        .from('food_orders')
        .insert({
          user_id: user.id,
          location,
          address: address.trim(),
          special_instructions: specialInstructions.trim(),
          subtotal,
          delivery_fee: DELIVERY_FEE,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: 'confirmed',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;

      // 2. Insert food_order_items
      const orderItems = items.map(ci => ({
        order_id: orderId,
        item_id: ci.item.id,
        item_name: ci.item.name,
        item_category: ci.item.category,
        quantity: ci.quantity,
        unit_price: ci.item.price,
        total_price: ci.item.price * ci.quantity,
        is_veg: ci.item.isVeg,
      }));

      const { error: itemsError } = await supabase
        .from('food_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Fire notification (non-blocking)
      const supabaseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();
      fetch(`${supabaseUrl}/functions/v1/send-food-order-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'Apikey': anonKey,
        },
        body: JSON.stringify({ order_id: orderId, user_id: user.id }),
      }).catch(() => {});

      // 4. Clear cart and navigate
      clearCart();
      navigate('/food-order-success', { state: { orderId }, replace: true });
    } catch (err: any) {
      setError('Failed to place order. Please try again.');
      console.error('[FoodCheckout] error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Menu</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Delivery + Instructions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Delivery Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              Delivery Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Area / Neighbourhood</label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select area</option>
                  {LOCATION_OPTIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address</label>
                <textarea
                  rows={3}
                  placeholder="House/flat number, street, landmark..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Special Instructions
              <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
            </h2>
            <textarea
              rows={2}
              placeholder="E.g. Less spicy, extra onions, ring doorbell twice..."
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
            <div className="flex items-center gap-3 border-2 border-blue-600 rounded-xl px-4 py-3 bg-blue-50">
              <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-900">Cash on Delivery</span>
              <span className="ml-auto text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">COD</span>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600" />
              Order Summary
            </h2>

            <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
              {items.map(ci => (
                <div key={ci.item.id} className="flex items-start gap-2">
                  <VegDot isVeg={ci.item.isVeg} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{ci.item.name}</p>
                    <p className="text-xs text-gray-500">x{ci.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    ₹{ci.item.price * ci.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Truck size={13} />
                  Delivery
                </span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-blue-600">₹{totalAmount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-5 bg-gray-50 rounded-xl p-3">
              <Leaf size={13} className="text-green-500 flex-shrink-0" />
              Free delivery on all orders
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20 text-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </span>
              ) : (
                `Place Order · ₹${totalAmount}`
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Pay ₹{totalAmount} in cash at the time of delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodCheckout;
