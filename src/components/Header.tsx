import { useState, useRef, useEffect } from 'react';
import { Home, Calendar, LogIn, User, Bell, UtensilsCrossed } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import NotificationsPanel from './profile/NotificationsPanel';

const Header = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/bookings', icon: Calendar, label: 'My Bookings', protected: true },
    { path: '/food-orders', icon: UtensilsCrossed, label: 'Food Orders', protected: true },
  ];

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
  }, [user, showNotifications]);

  return (
    <>
      <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-center">
          <Link to="/">
            <img
              src="/Logo.png"
              alt="Homitra - Trusted Home Services"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
      </header>
      <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src="/Logo.png"
                alt="Homitra - Trusted Home Services"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <nav className="flex items-center space-x-8">
              {navItems.map(({ path, icon: Icon, label, protected: isProtected }) => {
                if (isProtected && !user) return null;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                      isActive(path)
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive(path) ? 2.5 : 2} />
                    <span>{label}</span>
                  </Link>
                );
              })}

              {user && (
                <div className="relative">
                  <button
                    ref={bellRef}
                    onClick={() => setShowNotifications(v => !v)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                      showNotifications
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <div className="relative">
                      <Bell size={20} strokeWidth={showNotifications ? 2.5 : 2} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>Notifications</span>
                  </button>
                </div>
              )}

              {!user && (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                >
                  <LogIn size={20} />
                  <span>Sign In</span>
                </Link>
              )}

              {user && profile && (
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    isActive('/profile')
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-blue-600 text-white hover:bg-blue-700 font-semibold'
                  }`}
                >
                  <User size={18} strokeWidth={2} />
                  <span>{profile.full_name || profile.email.split('@')[0]}</span>
                </Link>
              )}
            </nav>
          </div>
        </div>

        {showNotifications && (
          <NotificationsPanel onClose={() => setShowNotifications(false)} />
        )}
      </header>
    </>
  );
};

export default Header;
