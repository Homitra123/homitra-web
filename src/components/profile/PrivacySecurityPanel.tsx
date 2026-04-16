import { useState } from 'react';
import { X, Shield, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
}

type View = 'menu' | 'change-password';

const PrivacySecurityPanel = ({ onClose }: Props) => {
  const [view, setView] = useState<View>('menu');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async () => {
    setPwError('');
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPwSuccess(false);
        setView('menu');
      }, 2000);
    }
  };

  const handleBack = () => {
    setView('menu');
    setPwError('');
    setPwSuccess(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[calc(100dvh-5rem)] sm:max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Privacy & Security</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {view === 'menu' && (
          <div className="px-6 py-5">
            <button
              onClick={() => setView('change-password')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Shield size={18} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </div>
              </div>
              <X size={16} className="text-gray-300 rotate-45 group-hover:text-blue-400 transition-colors" />
            </button>
            <div className="pb-2" />
          </div>
        )}

        {view === 'change-password' && (
          <div className="px-6 py-5 space-y-4">
            <button onClick={handleBack} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              ← Back
            </button>
            <p className="text-sm text-gray-600">Enter a new password for your account.</p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Check size={16} />
                Password updated successfully
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={pwLoading || pwSuccess}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {pwLoading && <Loader2 size={16} className="animate-spin" />}
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
            <div className="pb-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySecurityPanel;
