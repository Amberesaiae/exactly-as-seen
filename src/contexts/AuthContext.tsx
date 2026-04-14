import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  farmReady: boolean | null;
  farmId: string | null;
  farmName: string;
  currency: string;
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
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmName, setFarmName] = useState('My Farm');
  const [currency, setCurrency] = useState('GHS');

  const checkFarmSetup = async (userId: string) => {
    const { data } = await supabase
      .from('farms')
      .select('id, name, setup_complete')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setFarmId(data.id);
      setFarmName(data.name);
      setFarmReady(data.setup_complete);
    } else {
      setFarmReady(false);
    }

    // Load preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('currency, cost_privacy_enabled')
      .eq('user_id', userId)
      .maybeSingle();
    if (prefs) {
      setCurrency(prefs.currency);
      useAppStore.getState().setCostPrivacy(prefs.cost_privacy_enabled);
    }
  };

  const ensureFarmAndPrefs = async (userId: string, fullName?: string, farmNameArg?: string) => {
    const { data: existingFarm } = await supabase
      .from('farms')
      .select('id, name, setup_complete')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingFarm) {
      setFarmId(existingFarm.id);
      setFarmName(existingFarm.name);
      setFarmReady(existingFarm.setup_complete);
      return;
    }

    const { data: newFarm, error: farmError } = await supabase.from('farms').insert({
      user_id: userId,
      name: farmNameArg || 'My Farm',
      farm_type: 'poultry',
      setup_complete: false,
    }).select('id, name').single();

    if (!farmError && newFarm) {
      setFarmId(newFarm.id);
      setFarmName(newFarm.name);
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
        setTimeout(() => {
          checkFarmSetup(session.user.id);
        }, 0);
      } else {
        setFarmReady(null);
        setFarmId(null);
        setFarmName('My Farm');
        setCurrency('GHS');
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

  const signUp = async (email: string, password: string, fullName: string, farmNameArg: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error };

    if (data.user) {
      await ensureFarmAndPrefs(data.user.id, fullName, farmNameArg);
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
    setFarmId(null);
    setFarmName('My Farm');
    setCurrency('GHS');
  };

  const recheckFarm = async () => {
    if (user) await checkFarmSetup(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, farmReady, farmId, farmName, currency, signUp, signIn, signOut, recheckFarm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
