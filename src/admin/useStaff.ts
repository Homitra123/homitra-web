import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type StaffRole =
  | 'super_admin'
  | 'admin'
  | 'ops'
  | 'support'
  | 'finance'
  | 'marketing'
  | 'engineer'
  | 'read_only';

export interface StaffUser {
  user_id: string;
  full_name: string | null;
  role: StaffRole;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

interface UseStaffResult {
  staff: StaffUser | null;
  role: StaffRole | null;
  loading: boolean;
  isSuperAdmin: boolean;
  refresh: () => Promise<void>;
}

export function useStaff(): UseStaffResult {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async (userId: string) => {
    const { data, error } = await supabase
      .from('staff_users')
      .select('user_id, full_name, role, status, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[useStaff] error fetching staff row', error);
      setStaff(null);
      return;
    }
    setStaff(data as StaffUser | null);
  };

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchStaff(user.id);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        await fetchStaff(session.user.id);
      }
      if (!cancelled) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        (async () => {
          if (session?.user) {
            await fetchStaff(session.user.id);
          } else {
            setStaff(null);
          }
          if (!cancelled) setLoading(false);
        })();
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    staff,
    role: staff?.role ?? null,
    loading,
    isSuperAdmin: staff?.role === 'super_admin' && staff?.status === 'active',
    refresh,
  };
}
