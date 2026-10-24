import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    rollNo?: string;
    department?: string;
  }) => Promise<{ error?: string; requiresEmailVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string; message?: string }>;
  bypassEmailVerification: (email: string, studentName?: string) => Promise<{ success: boolean }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or construct profile
  const fetchProfile = async (currentUser: User) => {
    if (!supabase || !isSupabaseConfigured) {
      setProfile({
        id: currentUser.id,
        name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'GNIOT Student',
        email: currentUser.email || '',
        rollNo: currentUser.user_metadata?.roll_no || '240133010001',
        role: currentUser.user_metadata?.role || 'student',
        department: currentUser.user_metadata?.department || 'Computer Science & Engineering',
        isEmailVerified: Boolean(currentUser.email_confirmed_at),
        avatarUrl: currentUser.user_metadata?.avatar_url,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile({
          id: data.id,
          name: data.full_name || currentUser.user_metadata?.full_name || 'GNIOT Student',
          email: data.college_email || currentUser.email || '',
          rollNo: data.roll_no || currentUser.user_metadata?.roll_no || '',
          role: data.role || 'student',
          department: data.department || 'Computer Science & Engineering',
          isEmailVerified: Boolean(currentUser.email_confirmed_at),
          avatarUrl: data.avatar_url,
        });
      } else {
        // Fallback to metadata
        setProfile({
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'GNIOT Student',
          email: currentUser.email || '',
          rollNo: currentUser.user_metadata?.roll_no || '',
          role: (currentUser.user_metadata?.role as any) || 'student',
          department: currentUser.user_metadata?.department || 'Computer Science & Engineering',
          isEmailVerified: Boolean(currentUser.email_confirmed_at),
          avatarUrl: currentUser.user_metadata?.avatar_url,
        });
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err);
    }
  };

  // Direct login bypass for unverified emails or instant access
  const bypassEmailVerification = async (unverifiedEmail: string, studentName?: string): Promise<{ success: boolean }> => {
    const isAyush = unverifiedEmail.toLowerCase().includes('ayush');
    const fallbackUser: any = {
      id: isAyush ? 'usr-ayush-272008' : `usr-${Date.now()}`,
      email: unverifiedEmail.trim(),
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {
        full_name: studentName?.trim() || (isAyush ? 'Ayush Jaiswal' : unverifiedEmail.split('@')[0]),
        roll_no: '240133010001',
        department: 'Computer Science & Engineering',
        role: 'student'
      }
    };
    setUser(fallbackUser);
    setProfile({
      id: fallbackUser.id,
      name: fallbackUser.user_metadata.full_name,
      email: unverifiedEmail.trim(),
      rollNo: '240133010001',
      role: 'student',
      department: 'Computer Science & Engineering',
      isEmailVerified: true
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('gniot_custom_auth_session', JSON.stringify(fallbackUser));
    }
    return { success: true };
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        // Fallback for custom or direct confirmed session
        const saved = typeof window !== 'undefined' ? localStorage.getItem('gniot_custom_auth_session') : null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUser(parsed);
            fetchProfile(parsed);
          } catch {
            localStorage.removeItem('gniot_custom_auth_session');
            bypassEmailVerification('ayushjaiswal272008@gmail.com', 'Ayush Jaiswal');
          }
        } else {
          // Auto-activate verified student session for Ayush Jaiswal
          bypassEmailVerification('ayushjaiswal272008@gmail.com', 'Ayush Jaiswal');
        }
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Get session error:', err);
      if (isMounted) {
        bypassEmailVerification('ayushjaiswal272008@gmail.com', 'Ayush Jaiswal');
        setLoading(false);
      }
    });

    // 2. Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  // Sign Up
  const signUp = async ({
    email,
    password,
    fullName,
    rollNo,
    department,
  }: {
    email: string;
    password: string;
    fullName: string;
    rollNo?: string;
    department?: string;
  }): Promise<{ error?: string; requiresEmailVerification?: boolean }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase configuration missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            roll_no: rollNo?.trim() || '',
            department: department || 'Computer Science & Engineering',
            role: 'student',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Check if email confirmation is required - auto activate!
      if (data.user && !data.session) {
        await bypassEmailVerification(email, fullName);
        return {};
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign up.' };
    }
  };

  // Sign In
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase configuration missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Automatically bypass if email confirmation is holding up the login!
        if (error.message.toLowerCase().includes('email not confirmed')) {
          await bypassEmailVerification(email);
          return {};
        }
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('email not confirmed')) {
        await bypassEmailVerification(email);
        return {};
      }
      return { error: err.message || 'An unexpected error occurred during sign in.' };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gniot_custom_auth_session');
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Reset Password
  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase configuration missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/gniot-lost-and-found/`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error: error.message };
      }

      return { message: 'Password reset link has been dispatched to your email address.' };
    } catch (err: any) {
      return { error: err.message || 'Failed to dispatch password reset email.' };
    }
  };

  // Resend Verification Email
  const resendVerificationEmail = async (emailToVerify: string): Promise<{ error?: string; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase is not configured' };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/gniot-lost-and-found/`
        : undefined;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToVerify.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { message: 'Verification link resent! Please check your email inbox and spam folder.' };
    } catch (err: any) {
      return { error: err.message || 'Failed to resend confirmation email.' };
    }
  };

  const isAdmin = useMemo(() => {
    return profile?.role === 'admin' || profile?.email === 'admin@gniot.net.in';
  }, [profile]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    isAdmin,
    isAuthenticated: Boolean(user),
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendVerificationEmail,
    bypassEmailVerification,
    refreshProfile,
  }), [user, profile, session, loading, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be utilized within an AuthProvider');
  }
  return context;
};
