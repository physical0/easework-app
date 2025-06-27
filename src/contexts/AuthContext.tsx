import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase';
import { AuthContext } from './AuthContextDef';


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false); 

useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      const { session } = data;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, sessionResponse: Session | null) => {
        setSession(sessionResponse);
        setUser(sessionResponse?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

   const signUp = async (email: string, password: string, username?: string) => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          },
        },
      });
      if (error) throw error;
      return { success: true, message: 'Check your email for the confirmation link!' };
    } catch (error: unknown) {
      return { success: false, message: (error as Error).message };
    } finally {
      setAuthLoading(false);
    }
  };

   const signIn = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, message: 'Signed in successfully!' };
    } catch (error: unknown) {
      return { success: false, message: (error as Error).message };
    } finally {
      setAuthLoading(false);
    }
  };


  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value = {
    session,
    user,
    signOut,
    loading,
    signIn,
    signUp,
    authLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

