import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'employee') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
  setUser(session?.user ?? null);
  if (session?.user) {
    await loadProfile(session.user.id);
  } else {
    setProfile(null);
    setLoading(false);
  }
});

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // FIX: If profile isn't found yet, wait 500ms and try again (up to 3 times)
      if (!data && retryCount < 3) {
        console.log(`Profile not found, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => loadProfile(userId, retryCount + 1), 500);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      // Only stop loading if we found data or ran out of retries
      if (retryCount === 3 || data) {
        setLoading(false);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

// UPDATE the signUp function inside AuthContext.tsx

// In src/contexts/AuthContext.tsx

const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'employee') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role, // <--- Add this line to pass the role to the database trigger
      }
    }
  });

  if (error) throw error;
};

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
