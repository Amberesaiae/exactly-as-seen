// Supabase browser client — keys from Vite env (local or hosted).
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
/** Prefer publishable key; accept classic anon key name used in docs. */
const SUPABASE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY). See docs/BACKEND_LOCAL.md'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

/** Safe auth storage: real localStorage in browser; memory fallback in tests/SSR. */
function createAuthStorage(): Storage {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const k = '__lf_auth_probe__';
      globalThis.localStorage.setItem(k, '1');
      globalThis.localStorage.removeItem(k);
      return globalThis.localStorage;
    }
  } catch {
    /* private mode / missing */
  }
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear() { map.clear(); },
    getItem(key) { return map.has(key) ? map.get(key)! : null; },
    key(i) { return Array.from(map.keys())[i] ?? null; },
    removeItem(key) { map.delete(key); },
    setItem(key, value) { map.set(key, String(value)); },
  };
}

export const supabase = createClient<Database>(
  SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_KEY || 'missing-key',
  {
    auth: {
      storage: createAuthStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);