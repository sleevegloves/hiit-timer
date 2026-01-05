"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  displayName: string | null;
  initials: string | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  displayName: null,
  initials: null,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isConfigured = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isSupabaseConfigured();
  }, []);

  // Compute display name from user metadata
  const displayName = useMemo(() => {
    if (!user) return null;
    const metadata = user.user_metadata;
    if (metadata?.first_name) {
      return metadata.first_name;
    }
    // Fallback to email prefix
    return user.email?.split("@")[0] || null;
  }, [user]);

  // Compute initials from user metadata
  const initials = useMemo(() => {
    if (!user) return null;
    const metadata = user.user_metadata;
    if (metadata?.first_name && metadata?.last_name) {
      return `${metadata.first_name[0]}${metadata.last_name[0]}`.toUpperCase();
    }
    if (metadata?.first_name) {
      return metadata.first_name[0].toUpperCase();
    }
    // Fallback to email first letter
    return user.email?.[0].toUpperCase() || null;
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      setLoading(false);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [mounted, isConfigured]);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase not configured") };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || "",
          last_name: lastName || "",
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase not configured") };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const supabase = createClient();
    if (!supabase) return;

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isConfigured, displayName, initials, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
