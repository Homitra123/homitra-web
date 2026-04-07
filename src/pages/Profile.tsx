import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ChevronRight, LogOut, Bell, Shield, HelpCircle, CreditCard as Edit2, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, getSupabaseUrl, getSupabaseAnonKey } from '../lib/supabase';

const Profile = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const isInitialLoadRef = useRef(true);
  const hasLoadedStatsRef = useRef(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
  });
  const [statsError, setStatsError] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    currentUserId: '',
    fetchStatus: '',
    rawDataCount: 0,
    rlsBypassCount: 0,
    timestamp: '',
    loadAttempts: 0,
    isInitialLoad: true,
  });

  useEffect(() => {
    console.log('[Profile] Re-rendering due to:', {
      userId: user?.id,
      profileId: profile?.id,
      isInitialLoad: isInitialLoadRef.current,
      hasLoadedOnce: hasLoadedStatsRef.current
    });

    if (profile) {
      setPhoneNumber(profile.phone || '');
      setFullName(profile.full_name || '');

      if (isInitialLoadRef.current) {
        console.log('[Profile] First mount - loading stats');
        fetchBookingStats(true);
      } else if (hasLoadedStatsRef.current) {
        console.log('[Profile] Navigation return - silently refreshing stats in background');
        fetchBookingStats(false);
      }
    }
  }, [user?.id, profile?.id]);

  const fetchBookingStats = async (isInitial = false) => {
    if (!user) {
      console.log('[Profile] No user found');
      return;
    }

    const attemptNumber = (debugInfo.loadAttempts || 0) + 1;
    console.log('[Profile] Starting stats fetch #', attemptNumber, 'for user UUID:', user.id);

    if (isInitial && isInitialLoadRef.current) {
      setLoadingStats(true);
    }

    setStatsError(false);

    setDebugInfo(prev => ({
      ...prev,
      currentUserId: user.id,
      fetchStatus: 'Fetching...',
      rawDataCount: 0,
      rlsBypassCount: 0,
      timestamp: new Date().toLocaleTimeString(),
      loadAttempts: attemptNumber,
      isInitialLoad: isInitial,
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.access_token) {
        console.error('[Profile] Auth Token Missing');
        setStatsError(true);
        setDebugInfo(prev => ({ ...prev, fetchStatus: 'Auth Failed' }));
        setLoadingStats(false);
        return;
      }

      const baseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();
      const url = `${baseUrl}/rest/v1/bookings?user_id=eq.${user.id}&select=status`;

      console.log('[Profile] Using native fetch with 2s timeout');

      const response = await Promise.race([
        fetch(url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 2000)
        ),
      ]) as Response;

      if (!response.ok) {
        console.error('[Profile] Fetch error:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }

      const bookings = await response.json();
      console.log('[Profile] Successfully loaded', bookings.length, 'booking records');

      const total = bookings.length;
      const completed = bookings.filter((b: any) => b.status === 'completed').length;
      const active = bookings.filter((b: any) => b.status !== 'completed' && b.status !== 'cancelled').length;

      setBookingStats({ total, completed, active });
      setStatsError(false);
      setDebugInfo(prev => ({ ...prev, fetchStatus: 'Success', rawDataCount: total }));
    } catch (err: any) {
      console.error('[Profile] Fetch error:', err);
      setStatsError(true);
      setDebugInfo(prev => ({ ...prev, fetchStatus: 'Error: ' + err.message }));
    } finally {
      if (isInitial && isInitialLoadRef.current) {
        console.log('[Profile] Initial stats load complete');
        setLoadingStats(false);
        isInitialLoadRef.current = false;
        hasLoadedStatsRef.current = true;
      }
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
    setSuccessMessage('');

    try {
      const { error: updateError } = await updateProfile({ phone: phoneNumber });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setIsEditingPhone(false);
      setSuccessMessage('Phone number updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('[Profile] Update error:', err);
      setError(`Failed to update phone number: ${err.message}`);
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
    setSuccessMessage('');

    try {
      const { error: updateError } = await updateProfile({ full_name: fullName });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setIsEditingName(false);
      setSuccessMessage('Name updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('[Profile] Update error:', err);
      setError(`Failed to update name: ${err.message}`);
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
    return null;
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
          {!profile.phone && !successMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
              Please add your phone number to complete bookings
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Check size={16} />
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Statistics</h3>
        {loadingStats ? (
          <div className="flex items-center justify-center space-x-3 py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Checking for bookings...</p>
          </div>
        ) : statsError ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-1">Unable to load booking statistics</p>
            <p className="text-sm text-gray-500 mb-4">Check console for details</p>
            <button
              onClick={() => fetchBookingStats(true)}
              className="bg-blue-600 text-white py-2 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              Retry
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

      <div className="mt-8 bg-black text-white p-6 rounded-xl font-mono text-xs">
        <div className="font-bold mb-3 text-yellow-400">DEBUG INFO - PERSISTENT</div>
        <div className="space-y-2">
          <div><span className="text-gray-400">Current User UUID:</span> {debugInfo.currentUserId.slice(0, 20) || 'N/A'}...</div>
          <div><span className="text-gray-400">Fetch Status:</span> {debugInfo.fetchStatus || 'Not started'}</div>
          <div><span className="text-gray-400">Raw Data Count:</span> {debugInfo.rawDataCount}</div>
          <div><span className="text-gray-400">RLS Bypass Count:</span> {debugInfo.rlsBypassCount}</div>
          <div><span className="text-gray-400">Timestamp:</span> {debugInfo.timestamp || 'N/A'}</div>
          <div><span className="text-gray-400">Load Attempts:</span> {debugInfo.loadAttempts}</div>
          <div><span className="text-gray-400">Is Initial Load:</span> {debugInfo.isInitialLoad ? 'YES' : 'NO'}</div>
          <div><span className="text-gray-400">Loading State:</span> {loadingStats ? 'TRUE' : 'FALSE'}</div>
          <div><span className="text-gray-400">Has Loaded Once:</span> {hasLoadedStatsRef.current ? 'YES' : 'NO'}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
