'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, type AuthUser } from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

 // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let authSubscription: (() => void) | null = null;

    const initializeAuth = async () => {
      console.log('[AuthContext] 🚀 Initializing auth');
      
      try {
        // Check for existing session
        const currentUser = await authService.getCurrentUser();
        
        if (mounted) {
          setUser(currentUser);
          console.log('[AuthContext] ✅ Initial auth state set', { hasUser: !!currentUser });
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Auth initialization failed', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    const setupAuthListener = () => {
      console.log('[AuthContext] 👂 Setting up auth listener');
      
      try {
        // Set up auth state change listener with correct Supabase pattern
        const unsubscribe = authService.onAuthStateChange((newUser) => {
          if (!mounted) return;
          
          console.log('[AuthContext] 🔄 Auth state changed', { hasUser: !!newUser });
          setUser(newUser);
          setLoading(false);
        });

        // Store the unsubscribe function directly
        authSubscription = unsubscribe;
        
        console.log('[AuthContext] ✅ Auth listener established');
        
      } catch (error) {
        console.error('[AuthContext] ❌ Failed to setup auth listener:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize everything
    const init = async () => {
      await initializeAuth();
      setupAuthListener();
    };

    init().catch(error => {
      console.error('[AuthContext] ❌ Initialization failed:', error);
      if (mounted) {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      console.log('[AuthContext] 🧹 Cleanup');
      mounted = false;
      
      // Safe cleanup with proper error handling
      if (authSubscription && typeof authSubscription === 'function') {
        try {
          console.log('[AuthContext] 🔌 Unsubscribing from auth listener');
          authSubscription();
        } catch (error) {
          console.warn('[AuthContext] ⚠️ Error during auth subscription cleanup:', error);
        }
        authSubscription = null;
      }
    };
  }, []);

   // Proactive session refresh to keep the user logged in and prevent session expiration
 useEffect(() => {
     const sessionRefreshInterval = setInterval(async () => {
      try {
        console.log('[AuthContext] ⏳ Proactively refreshing session...');
        // This call will automatically refresh the token if needed.
        // The onAuthStateChange listener will handle the state update.
        // NOTE: By calling getCurrentUser, we implicitly refresh the session if needed.
        await authService.getCurrentUser();
      } catch (error) {
        console.error('[AuthContext] ❌ Proactive session refresh failed:', error);
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    return () => clearInterval(sessionRefreshInterval);
  }, []);

 const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] 🔑 Sign in attempt', { email });
    setLoading(true);
    
    try {
      const { user: authUser } = await authService.signIn(email, password);
      setUser(authUser);
      console.log('[AuthContext] ✅ Sign in successful', authUser);
    } catch (error) {
      console.error('[AuthContext] ❌ Sign in failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] 🚪 Sign out attempt');
    setLoading(true);
    
    try {
      await authService.signOut();
      setUser(null);
      console.log('[AuthContext] ✅ Sign out successful');
    } catch (error) {
      console.error('[AuthContext] ❌ Sign out failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading: loading || !initialized,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
  };

  return (
    <AuthContext.Provider value={value}>
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