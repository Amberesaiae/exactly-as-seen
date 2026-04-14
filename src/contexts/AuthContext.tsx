import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  farmReady: boolean | null; // null = not checked yet, true = setup_complete, false = needs setup
  signUp: (email: string, password: string, fullName: string, farmName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  recheckFarm: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmReady, setFarmReady] = useState<boolean | null>(null);

  const checkFarmSetup = async (userId: string) => {
    const { data } = await supabase
      .from('farms')
      .select('setup_complete')
      .eq('user_id', userId)
      .maybeSingle();
    setFarmReady(data?.setup_complete ?? false);
  };

  const ensureFarmAndPrefs = async (userId: string, fullName?: string, farmName?: string) => {
    // Check if farm exists
    const { data: existingFarm } = await supabase
      .from('farms')
      .select('id, setup_complete')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingFarm) {
      setFarmReady(existingFarm.setup_complete);
      return;
    }

    // Create farm + preferences for new users
    const { error: farmError } = await supabase.from('farms').insert({
      user_id: userId,
      name: farmName || 'My Farm',
      farm_type: 'poultry',
      setup_complete: false,
    });

    if (!farmError) {
      await supabase.from('user_preferences').insert({
        user_id: userId,
        cost_privacy_enabled: true,
        theme: 'light',
        currency: 'GHS',
      });
    }

    setFarmReady(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        // Defer to avoid Supabase auth deadlock
        setTimeout(() => {
          checkFarmSetup(session.user.id);
        }, 0);
      } else {
        setFarmReady(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkFarmSetup(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, farmName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error };

    // With auto-confirm enabled, user gets a session immediately
    if (data.user) {
      await ensureFarmAndPrefs(data.user.id, fullName, farmName);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setFarmReady(null);
  };

  const recheckFarm = async () => {
    if (user) await checkFarmSetup(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, farmReady, signUp, signIn, signOut, recheckFarm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
