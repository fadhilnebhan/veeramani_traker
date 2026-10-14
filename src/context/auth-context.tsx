'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  loginAsDemoRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
  updateProfile: (displayName: string, showAttribution: boolean) => Promise<boolean>;
}

const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  user: {
    id: 'demo-user-1',
    display_name: 'ChennaiSuperFan',
    show_public_attribution: true,
    role: 'user',
    account_status: 'active',
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-14T00:00:00.000Z',
  },
  moderator: {
    id: 'demo-mod-1',
    display_name: 'NellaiModChief',
    show_public_attribution: false,
    role: 'moderator',
    account_status: 'active',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-10-14T00:00:00.000Z',
  },
  admin: {
    id: 'demo-admin-1',
    display_name: 'LeadDirector',
    show_public_attribution: false,
    role: 'admin',
    account_status: 'active',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-10-14T00:00:00.000Z',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    if (!configured) {
      setIsDemo(true);
      try {
        const saved = localStorage.getItem('vt_demo_user');
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          setUser(DEMO_PROFILES.user);
        }
      } catch {
        setUser(DEMO_PROFILES.user);
      }
      setIsLoading(false);
      return;
    }

    setIsDemo(false);

    // Supabase is configured: wire real Supabase auth
    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error || !data) {
          // Fallback if profile trigger delayed
          setUser({
            id: userId,
            display_name: 'Public Contributor',
            show_public_attribution: false,
            role: 'user',
            account_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          setUser(data as UserProfile);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginAsDemoRole = (role: UserRole) => {
    const profile = DEMO_PROFILES[role];
    setUser(profile);
    try {
      localStorage.setItem('vt_demo_user', JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
  };

  const signOut = async () => {
    if (!isDemo) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    try {
      localStorage.removeItem('vt_demo_user');
    } catch {
      // ignore
    }
  };

  const updateProfile = async (displayName: string, showAttribution: boolean): Promise<boolean> => {
    if (!user) return false;

    if (isDemo) {
      const updated: UserProfile = {
        ...user,
        display_name: displayName,
        show_public_attribution: showAttribution,
        updated_at: new Date().toISOString(),
      };
      setUser(updated);
      try {
        localStorage.setItem('vt_demo_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return true;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          show_public_attribution: showAttribution,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error) {
        setUser((prev) =>
          prev
            ? { ...prev, display_name: displayName, show_public_attribution: showAttribution }
            : null
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode: isDemo,
        loginAsDemoRole,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
