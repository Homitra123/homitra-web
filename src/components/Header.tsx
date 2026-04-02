import { Home, Calendar, User, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, profile } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/bookings', icon: Calendar, label: 'My Bookings', protected: true },
    { path: '/profile', icon: User, label: 'Profile', protected: true },
  ];

  return (
    <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/image.png"
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
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {profile.full_name ? profile.full_name[0].toUpperCase() : profile.email[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {profile.full_name || profile.email.split('@')[0]}
                </span>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
