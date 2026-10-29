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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or construct profile from Supabase profiles table
  const fetchProfile = async (currentUser: User) => {
    if (!supabase || !isSupabaseConfigured) {
      setProfile({
        id: currentUser.id,
        name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Campus Student',
        email: currentUser.email || '',
        rollNo: currentUser.user_metadata?.roll_no || '',
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
        .maybeSingle();

      if (!error && data) {
        setProfile({
          id: data.id,
          name: data.full_name || currentUser.user_metadata?.full_name || 'Campus Student',
          email: data.college_email || currentUser.email || '',
          rollNo: data.roll_no || currentUser.user_metadata?.roll_no || '',
          role: data.role || 'student',
          department: data.department || 'Computer Science & Engineering',
          isEmailVerified: Boolean(currentUser.email_confirmed_at),
          avatarUrl: data.avatar_url,
        });
      } else {
        // Fallback to auth user metadata
        const metadataProfile: UserProfile = {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Campus Student',
          email: currentUser.email || '',
          rollNo: currentUser.user_metadata?.roll_no || '',
          role: (currentUser.user_metadata?.role as any) || 'student',
          department: currentUser.user_metadata?.department || 'Computer Science & Engineering',
          isEmailVerified: Boolean(currentUser.email_confirmed_at),
          avatarUrl: currentUser.user_metadata?.avatar_url,
        };
        setProfile(metadataProfile);

        // If profile row doesn't exist yet, insert it safely into profiles table
        if (!data) {
          try {
            await supabase.from('profiles').insert([{
              id: currentUser.id,
              full_name: metadataProfile.name,
              college_email: metadataProfile.email,
              roll_no: metadataProfile.rollNo || '',
              department: metadataProfile.department,
              role: metadataProfile.role,
              updated_at: new Date().toISOString()
            }]);
          } catch (insertErr) {
            console.warn('Initial profile sync warning:', insertErr);
          }
        }
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    // 1. Get initial session from Supabase client
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;

      if (error) {
        console.warn('Supabase getSession warning:', error.message);
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        // Unauthenticated visitor: keep state completely clean
        setProfile(null);
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Initial auth session error:', err);
      if (isMounted) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Listen to real-time auth state transitions (sign in, sign out, token refresh)
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

  // Real Supabase Sign Up
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
      return { error: 'Supabase configuration is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanRollNo = rollNo?.trim() || '';
    const cleanDept = department?.trim() || 'Computer Science & Engineering';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { error: 'Password must contain at least 6 characters.' };
    }
    if (!cleanName) {
      return { error: 'Please enter your full name.' };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/gniot-lost-and-found/`
        : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: cleanName,
            roll_no: cleanRollNo,
            department: cleanDept,
            role: 'student',
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already exists')) {
          return { error: 'An account with this email already exists. Please Sign In instead.' };
        }
        if (msg.includes('password') && msg.includes('weak')) {
          return { error: 'Password is too weak. Please choose a password with at least 6 characters.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        // Attempt to sync to profiles table
        try {
          await supabase.from('profiles').upsert([{
            id: data.user.id,
            full_name: cleanName,
            college_email: cleanEmail,
            roll_no: cleanRollNo,
            department: cleanDept,
            role: 'student',
            updated_at: new Date().toISOString(),
          }], { onConflict: 'id' });
        } catch (profileErr) {
          console.warn('Profile sync on sign up:', profileErr);
        }

        // Check if session exists (auto-confirmed) or email confirmation is required
        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          await fetchProfile(data.user);
          return { requiresEmailVerification: false };
        } else {
          return { requiresEmailVerification: true };
        }
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign up.' };
    }
  };

  // Real Supabase Sign In with Password
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase configuration is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { error: 'Please enter your password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          return { error: 'Invalid email or password. Please verify your credentials or create an account.' };
        }
        if (msg.includes('email not confirmed') || msg.includes('not verified')) {
          return { error: 'Your email address has not been confirmed yet. Please check your email inbox for the Supabase confirmation link.' };
        }
        return { error: error.message };
      }

      if (data?.session && data?.user) {
        setSession(data.session);
        setUser(data.user);
        await fetchProfile(data.user);
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign in.' };
    }
  };

  // Real Supabase Sign Out: clears Supabase session and local React state
  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gniot_custom_auth_session');
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Supabase Password Reset
  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase configuration missing.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/gniot-lost-and-found/`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error: error.message };
      }

      return { message: 'Password reset link has been dispatched to your email address. Please check your inbox.' };
    } catch (err: any) {
      return { error: err.message || 'Failed to dispatch password reset email.' };
    }
  };

  // Resend Email Verification
  const resendVerificationEmail = async (emailToVerify: string): Promise<{ error?: string; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase is not configured.' };
    }

    const cleanEmail = emailToVerify.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/gniot-lost-and-found/`
        : undefined;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
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
