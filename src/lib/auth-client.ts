"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SignInEmailArgs = {
  email: string;
  password: string;
  rememberMe?: boolean;
  callbackURL?: string;
};

type SignUpEmailArgs = {
  email: string;
  password: string;
  name?: string;
};

export const authClient = {
  signIn: {
    email: async ({ email, password, callbackURL }: SignInEmailArgs) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[AUTH] signIn attempt:', { email, hasPassword: !!password });
      console.log('[AUTH] signIn result:', { data: data?.user ? 'has user' : 'no user', error });
      try {
        const token = data?.session?.access_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('bearer_token', token);
        }
      } catch {}
      if (!error && callbackURL && typeof window !== "undefined") {
        window.location.assign(callbackURL);
      }
      // Normalize error shape to be compatible with existing UI checks (error?.code)
      const normError = error ? { code: String((error as any).status ?? "AUTH_ERROR"), message: error.message } : null;
      console.log('[AUTH] normalized error:', normError);
      return { data, error: normError } as const;
    },
  },
  signUp: {
    email: async ({ email, password, name }: SignUpEmailArgs) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name ?? "" } },
      });
      console.log('[AUTH] signUp attempt:', { email, hasPassword: !!password, name });
      console.log('[AUTH] signUp result:', { data: data?.user ? 'has user' : 'no user', error });
      // Map error to include code like USER_ALREADY_EXISTS when possible
      let normError: any = null;
      if (error) {
        const code = (error as any).status === 409 ? "USER_ALREADY_EXISTS" : String((error as any).status ?? "AUTH_ERROR");
        normError = { code, message: error.message };
      }
      console.log('[AUTH] signUp normalized error:', normError);
      return { data, error: normError } as const;
    },
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('bearer_token'); } catch {}
    }
    // Normalize error shape
    const normError = error ? { code: String((error as any).status ?? "AUTH_ERROR"), message: error.message } : null;
    return { error: normError } as const;
  },
  getSession: async () => supabase.auth.getSession(),
};

export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const s = data.session;
      setSession(
        s
          ? {
              user: {
                id: s.user.id,
                email: s.user.email,
                name: s.user.user_metadata?.full_name || s.user.user_metadata?.name || s.user.email,
              },
            }
          : null
      );
      setError(null);
    } catch (err) {
      setSession(null);
      setError(err);
    } finally {
      setIsPending(false);
    }
  };

  const refetch = () => {
    setIsPending(true);
    setError(null);
    fetchSession();
  };

  useEffect(() => {
    fetchSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      // keep Authorization header token in sync
      try {
        if (session?.access_token) {
          localStorage.setItem('bearer_token', session.access_token);
        } else if (!session) {
          localStorage.removeItem('bearer_token');
        }
      } catch {}
      fetchSession();
    });
    return () => {
      listener.subscription?.unsubscribe();
    };
  }, []);

  return { data: session, isPending, error, refetch } as const;
}