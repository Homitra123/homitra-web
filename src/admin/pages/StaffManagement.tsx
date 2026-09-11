import { useState, useEffect, useCallback } from 'react';
import { UserCog, UserPlus, Ban, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase, getSupabaseUrl, getSupabaseAnonKey } from '../../lib/supabase';
import { StaffRole } from '../useStaff';

interface StaffRow {
  user_id: string;
  full_name: string | null;
  role: StaffRole;
  status: 'active' | 'suspended';
  created_at: string;
}

interface AuditRow {
  id: string;
  actor_email: string | null;
  action: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'ops', label: 'Operations' },
  { value: 'support', label: 'Support' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'read_only', label: 'Read Only' },
];

const addSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.string().min(1, 'Select a role'),
});

type AddValues = z.infer<typeof addSchema>;

type Toast = { type: 'success' | 'error'; message: string } | null;

const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<StaffRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { email: '', role: 'support' },
  });

  const fetchStaff = useCallback(async () => {
    const { data, error } = await supabase
      .from('staff_users')
      .select('user_id, full_name, role, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[StaffManagement] fetch staff error', error);
      return;
    }
    setStaff(data as StaffRow[]);
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, actor_email, action, entity_id, metadata, created_at')
      .eq('entity_type', 'staff_users')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[StaffManagement] fetch audit error', error);
      return;
    }
    setAuditLogs(data as AuditRow[]);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStaff(), fetchAuditLogs()]);
    setLoading(false);
  }, [fetchStaff, fetchAuditLogs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const callEdgeFunction = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${getSupabaseUrl()}/functions/v1/admin-manage-staff`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: getSupabaseAnonKey(),
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error ?? 'Request failed');
    }
    return result;
  };

  const handleAddStaff = async (values: AddValues) => {
    setActionLoading(true);
    try {
      await callEdgeFunction({
        action: 'add',
        email: values.email,
        role: values.role,
      });
      showToast('success', 'Staff member added successfully.');
      reset({ email: '', role: 'support' });
      setShowAddForm(false);
      await loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not add staff member.';
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setActionLoading(true);
    try {
      // We need the email for the edge function; fetch from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', confirmDeactivate.user_id)
        .maybeSingle();

      const email = profile?.email;
      if (!email) {
        showToast('error', 'Could not resolve staff member email.');
        setActionLoading(false);
        return;
      }

      await callEdgeFunction({
        action: 'deactivate',
        email,
      });
      showToast('success', 'Staff member deactivated.');
      setConfirmDeactivate(null);
      await loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not deactivate staff member.';
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAction = (action: string) => {
    return action
      .replace('staff.', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={18} className="text-emerald-600" />
          ) : (
            <AlertCircle size={18} className="text-red-600" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCog className="h-6 w-6 text-slate-500" />
            Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Add, manage, and audit operator access.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <UserPlus size={18} />
          Add Staff
        </button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Add a new staff member</h2>
          <form onSubmit={handleSubmit(handleAddStaff)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800"
                placeholder="name@homitra.co.in"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Role
              </label>
              <select
                {...register('role')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 bg-white"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
          <p className="text-xs text-slate-400 mt-3">
            The person must have signed up on the site first. Their existing
            account will be promoted to staff.
          </p>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">All Staff</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No staff members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((row) => (
                  <tr key={row.user_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">
                        {row.full_name || 'Unnamed'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-semibold capitalize px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                        {row.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.status === 'active' && row.role !== 'super_admin' && (
                        <button
                          onClick={() => setConfirmDeactivate(row)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          <Ban size={15} />
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Recent Staff Audit Log</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No staff changes recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">
                      {formatAction(log.action)}
                    </span>
                    <span className="text-xs text-slate-400">by {log.actor_email || 'system'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(log.created_at)}
                    {log.metadata && typeof log.metadata === 'object' && 'email' in log.metadata && (
                      <> &middot; {(log.metadata as Record<string, unknown>).email as string}</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Ban className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
              Deactivate staff member?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              {confirmDeactivate.full_name || 'This staff member'} will lose
              access to the admin console immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeactivate(null)}
                disabled={actionLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
