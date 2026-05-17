import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Search, Leaf, X, ChevronRight, Clock, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS, MENU_CATEGORIES, MIN_ORDER_AMOUNT, DELIVERY_FEE, ESTIMATED_DELIVERY_MINUTES } from '../data/menuData';
import type { MenuItem } from '../data/menuData';

const VegIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 border border-green-600 rounded-sm flex-shrink-0">
    <span className="w-2 h-2 rounded-full bg-green-600" />
  </span>
);

const NonVegIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 border border-red-600 rounded-sm flex-shrink-0">
    <span className="w-2 h-2 rounded-full bg-red-600" />
  </span>
);

const MenuItemCard = ({ item }: { item: MenuItem }) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(c => c.item.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {item.isPopular && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Popular
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-1">
          {item.isVeg ? <VegIcon /> : <NonVegIcon />}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-3">{item.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">₹{item.price}</span>
            {item.servingNote && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                {item.servingNote}
              </span>
            )}
          </div>
          {qty === 0 ? (
            <button
              onClick={() => addItem(item)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-blue-600 rounded-xl overflow-hidden">
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                className="text-white px-2.5 py-1.5 hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <span className="text-white text-sm font-bold w-5 text-center">{qty}</span>
              <button
                onClick={() => addItem(item)}
                className="text-white px-2.5 py-1.5 hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CloudKitchen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalItems, subtotal, removeItem, updateQuantity } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [filter, setFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const categoryBarRef = useRef<HTMLDivElement>(null);

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'veg' && item.isVeg) ||
      (filter === 'nonveg' && !item.isVeg);
    return matchesCategory && matchesSearch && matchesFilter;
  });

  const canCheckout = subtotal >= MIN_ORDER_AMOUNT;
  const remaining = MIN_ORDER_AMOUNT - subtotal;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/cloud-kitchen' } });
      return;
    }
    navigate('/food-checkout');
  };

  // Close cart on outside click
  useEffect(() => {
    if (!showCart) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-cart]')) setShowCart(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCart]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-32 md:pb-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-8 mt-2">
        <img
          src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Homitra Kitchen"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center px-6 md:px-10">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Homitra Kitchen</h1>
            <p className="text-gray-200 text-sm md:text-base mb-4">Fresh home-style food, delivered to your door</p>
            <div className="flex items-center gap-4 text-white text-sm">
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {ESTIMATED_DELIVERY_MINUTES} mins
              </span>
              <span className="flex items-center gap-1.5">
                <Truck size={14} />
                Free delivery
              </span>
              <span className="flex items-center gap-1.5">
                <Leaf size={14} className="text-green-400" />
                Min order ₹{MIN_ORDER_AMOUNT}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(['all', 'veg', 'nonveg'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'veg' ? 'Veg' : 'Non-Veg'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div ref={categoryBarRef} className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {MENU_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🍽️</p>
          <p className="text-gray-600 font-medium">No dishes found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50">
          <div
            data-cart
            className="bg-blue-600 rounded-2xl shadow-2xl shadow-blue-600/40 overflow-hidden"
          >
            <button
              onClick={() => setShowCart(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-white"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl px-2.5 py-1 text-sm font-bold">{totalItems}</div>
                <span className="font-semibold">View Cart</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">₹{subtotal}</span>
                <ChevronRight size={18} className={`transition-transform ${showCart ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {showCart && (
              <div className="bg-white border-t border-blue-100 rounded-b-2xl">
                <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
                  {items.map(ci => (
                    <div key={ci.item.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {ci.item.isVeg ? <VegIcon /> : <NonVegIcon />}
                          <p className="text-sm font-medium text-gray-900 truncate">{ci.item.name}</p>
                        </div>
                        <p className="text-xs text-gray-500">₹{ci.item.price} each</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-600 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                          className="text-white px-2 py-1 hover:bg-blue-700 transition-colors"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="text-white text-sm font-bold w-4 text-center">{ci.quantity}</span>
                        <button
                          onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                          className="text-white px-2 py-1 hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-14 text-right">
                        ₹{ci.item.price * ci.quantity}
                      </span>
                      <button onClick={() => removeItem(ci.item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>

                  {!canCheckout && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3 text-center">
                      Add items worth ₹{remaining} more to place your order
                    </p>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={!canCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Proceed to Checkout · ₹{subtotal}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudKitchen;
