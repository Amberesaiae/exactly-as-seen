// Lovable auth stub — replaced with direct Supabase OAuth
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

type OAuthProvider = "google" | "apple" | "microsoft";

// Map lovable provider names to Supabase provider names
const providerMap: Record<OAuthProvider, "google" | "apple" | "azure"> = {
  google: "google",
  apple: "apple",
  microsoft: "azure",
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerMap[provider],
        options: {
          redirectTo: opts?.redirect_uri ?? window.location.origin,
          queryParams: opts?.extraParams,
        },
      });
      if (error) return { error };
      return { redirected: true };
    },
  },
};
