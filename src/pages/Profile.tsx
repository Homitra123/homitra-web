import { User, Mail, Phone, MapPin, ChevronRight, LogOut, Bell, Shield, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Profile = () => {
  const { user, bookings } = useApp();

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;

  const menuItems = [
    { icon: Bell, label: 'Notifications', description: 'Manage your alerts' },
    { icon: Shield, label: 'Privacy & Security', description: 'Account protection' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-white">
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
            <p className="text-gray-600">Homitra Member</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-gray-700">
            <Mail size={20} className="text-gray-400" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-700">
            <Phone size={20} className="text-gray-400" />
            <span>{user.phone}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{totalBookings}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">{completedBookings}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{activeBookings}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Settings</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-6 md:px-8 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <item.icon size={20} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <button className="w-full bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-red-600 font-semibold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 group">
        <LogOut size={20} className="group-hover:translate-x-[-2px] transition-transform" />
        <span>Logout</span>
      </button>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Homitra v1.0.0</p>
        <p className="mt-1">Premium Home Services</p>
      </div>
    </div>
  );
};

export default Profile;
