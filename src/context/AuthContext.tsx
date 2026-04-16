import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isRecoveryMode: boolean;
  clearRecoveryMode: () => void;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const clearRecoveryMode = () => setIsRecoveryMode(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  };

  const createProfile = async (userId: string, email: string, fullName?: string, phone?: string) => {
    console.log('[AuthContext] Creating new profile for user:', userId);

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName || null,
        phone: phone || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[AuthContext] Error creating profile:', error);
      return null;
    }

    console.log('[AuthContext] Profile created successfully:', data);
    return data;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    let subscription: any = null;

    const initAuth = async () => {
      console.log('[AuthContext] Initializing auth...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] Session:', session?.user?.id || 'No session');
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('[AuthContext] User found, fetching profile...');
        let profileData = await fetchProfile(session.user.id);

        if (!profileData) {
          console.log('[AuthContext] Profile not found, creating new profile');
          profileData = await createProfile(
            session.user.id,
            session.user.email!,
            session.user.user_metadata?.full_name,
            session.user.user_metadata?.phone
          );
        } else {
          console.log('[AuthContext] Profile loaded:', profileData.id);
        }

        setProfile(profileData);
      }

      console.log('[AuthContext] Auth initialization complete, setting loading to false');
      setLoading(false);

      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryMode(true);
            setUser(session?.user ?? null);
            return;
          }

          setUser(session?.user ?? null);

          (async () => {
            if (session?.user) {
              let profileData = await fetchProfile(session.user.id);

              if (!profileData) {
                profileData = await createProfile(
                  session.user.id,
                  session.user.email!,
                  session.user.user_metadata?.full_name,
                  session.user.user_metadata?.phone
                );
              }

              setProfile(profileData);
            } else {
              setProfile(null);
            }
          })();
        }
      );

      subscription = data.subscription;
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Update profile error:', error);
      return { error };
    }

    await refreshProfile();
    return { error: null };
  };

  const value = {
    user,
    profile,
    loading,
    isRecoveryMode,
    clearRecoveryMode,
    signUp,
    signIn,
    resetPassword,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
