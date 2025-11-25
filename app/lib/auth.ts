import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface AuthResponse {
  user: AuthUser;
}

export class AuthService {
  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('🔍 Getting current user...');

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        return null;
      }

      if (!session?.user) {
        console.log('👤 No active session found');
        return null;
      }

      console.log('📋 Session found, getting user profile...');

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        return null;
      }

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        role: profile.role
      };

      console.log('✅ Current user retrieved:', { id: authUser.id, role: authUser.role });
      return authUser;

    } catch (error: any) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔑 Attempting sign in for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user returned from sign in');
      }

      console.log('📋 Getting user profile after sign in...');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error after sign in:', profileError);
        throw new Error('Failed to get user profile');
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        role: profile.role
      };

      console.log('✅ Sign in successful:', { id: authUser.id, role: authUser.role });

      return { user: authUser };

    } catch (error: any) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('🚪 Signing out...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Sign out error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Sign out successful');

    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Listen to auth state changes - returns unsubscribe function directly
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    console.log('👂 Setting up auth state listener');

    try {
      // Set up the auth state change listener with correct Supabase pattern
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state change event:', event, { hasSession: !!session });

          if (event === 'SIGNED_OUT' || !session?.user) {
            console.log('👋 User signed out or no session');
            callback(null);
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('👤 User signed in or token refreshed, getting profile...');

            try {
              // Get user profile
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.error('❌ Profile error in auth state change:', profileError);
                callback(null);
                return;
              }

              const authUser: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                role: profile.role
              };

              console.log('✅ Auth state change - user updated:', { id: authUser.id, role: authUser.role });
              callback(authUser);

            } catch (error) {
              console.error('❌ Error handling auth state change:', error);
              callback(null);
            }
          }
        }
      );

      console.log('✅ Auth state listener established');

      // Return the unsubscribe function directly
      return () => {
        console.log('🔌 Unsubscribing from auth state changes');
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error unsubscribing from auth state changes:', error);
        }
      };

    } catch (error) {
      console.error('❌ Failed to setup auth state listener:', error);
      
      // Return a no-op unsubscribe function if setup fails
      return () => {
        console.warn('⚠️ No-op unsubscribe - listener setup failed');
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();