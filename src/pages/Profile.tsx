import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ChevronRight, LogOut, Bell, Shield, HelpCircle, CreditCard as Edit2, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
  });
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phone || '');
      setFullName(profile.full_name || '');
      fetchBookingStats();
    }
  }, [profile]);

  const fetchBookingStats = async () => {
    if (!user) return;

    setStatsError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatsError(true);
        return;
      }

      const url = `https://talcyiifgehpcphwotej.supabase.co/rest/v1/bookings?user_id=eq.${user.id}&select=status`;

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbGN5aWlmZ2VocGNwaHdvdGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NzY5MzcsImV4cCI6MjA1OTM1MjkzN30.Tds-TKDqrQKJXXdmXt_tYEKfXu4O0HfGkdM0JMqI8Qw',
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const bookings = await response.json();
        if (bookings) {
          setBookingStats({
            total: bookings.length,
            completed: bookings.filter(b => b.status === 'completed').length,
            active: bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length,
          });
          setStatsError(false);
        }
      } else {
        setStatsError(true);
      }
    } catch (err) {
      console.error('Error fetching booking stats:', err);
      setStatsError(true);
    }
  };

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error: updateError } = await updateProfile({ phone: phoneNumber });

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError(`Failed to update phone number: ${updateError.message}`);
      } else {
        setIsEditingPhone(false);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(`Error: ${err.message}`);
    }

    setSaving(false);
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    const { error: updateError } = await updateProfile({ full_name: fullName });

    if (updateError) {
      setError('Failed to update name');
    } else {
      setIsEditingName(false);
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', description: 'Manage your alerts' },
    { icon: Shield, label: 'Privacy & Security', description: 'Account protection' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance' },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return profile.email[0].toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-white">
              {getInitials()}
            </span>
          </div>
          <div className="flex-1">
            {isEditingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <Check size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setFullName(profile.full_name || '');
                      setError('');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.full_name || profile.email}
                  </h2>
                  <p className="text-gray-600">Homitra Member</p>
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={18} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-gray-700">
            <Mail size={20} className="text-gray-400" />
            <span>{profile.email}</span>
          </div>
          <div className="flex items-center space-x-3">
            {isEditingPhone ? (
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Phone size={20} className="text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="flex gap-2 ml-8">
                  <button
                    onClick={handleSavePhone}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <Check size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPhone(false);
                      setPhoneNumber(profile.phone || '');
                      setError('');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Phone size={20} className="text-gray-400" />
                <span className="text-gray-700">
                  {profile.phone || 'No phone number'}
                </span>
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                >
                  <Edit2 size={18} className="text-gray-400" />
                </button>
              </>
            )}
          </div>
          {!profile.phone && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
              Please add your phone number to complete bookings
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Statistics</h3>
        {statsError ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">Unable to load statistics</p>
            <button
              onClick={fetchBookingStats}
              className="bg-blue-600 text-white py-2 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{bookingStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{bookingStats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">{bookingStats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        )}
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

      <button
        onClick={handleLogout}
        className="w-full bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-red-600 font-semibold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 group"
      >
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
