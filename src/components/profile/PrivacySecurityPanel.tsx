import { useState } from 'react';
import { X, Shield, Eye, EyeOff, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onClose: () => void;
  onAccountDeleted: () => void;
}

type View = 'menu' | 'change-password' | 'delete-confirm';

const PrivacySecurityPanel = ({ onClose, onAccountDeleted }: Props) => {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>('menu');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete account');
      await signOut();
      onAccountDeleted();
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleteLoading(false);
    }
  };

  const handleBack = () => {
    setView('menu');
    setPwError('');
    setPwSuccess(false);
    setNewPassword('');
    setConfirmPassword('');
    setDeleteConfirmText('');
    setDeleteError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl">
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
          <div className="px-6 py-5 space-y-3">
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

            <button
              onClick={() => setView('delete-confirm')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-red-100 hover:border-red-300 hover:bg-red-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-700">Delete Account</p>
                  <p className="text-sm text-red-400">Permanently remove your account</p>
                </div>
              </div>
              <X size={16} className="text-red-200 rotate-45 group-hover:text-red-400 transition-colors" />
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

        {view === 'delete-confirm' && (
          <div className="px-6 py-5 space-y-4">
            <button onClick={handleBack} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              ← Back
            </button>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">This action cannot be undone</p>
                  <p className="text-sm text-red-600">
                    Deleting your account will permanently remove all your data, bookings, and profile information from Homitra.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-2">
                Type <span className="font-semibold text-gray-900">DELETE</span> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
              />
            </div>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {deleteError}
              </div>
            )}

            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {deleteLoading && <Loader2 size={16} className="animate-spin" />}
              {deleteLoading ? 'Deleting account...' : 'Permanently Delete Account'}
            </button>
            <div className="pb-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySecurityPanel;
