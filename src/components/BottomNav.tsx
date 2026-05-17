import { Home, Calendar, User, UtensilsCrossed } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home', protected: false },
    { path: '/bookings', icon: Calendar, label: 'Bookings', protected: true },
    { path: '/food-orders', icon: UtensilsCrossed, label: 'Food Orders', protected: true },
    { path: '/profile', icon: User, label: 'Profile', protected: false },
  ];

  const visibleItems = navItems.filter(item => !item.protected || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {visibleItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive(path)
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium leading-tight text-center">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
