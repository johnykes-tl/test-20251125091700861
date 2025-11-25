import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export class SupabaseAdminService {
  /**
   * Create auth user with admin privileges
   */
  static async createAuthUser(email: string, password: string) {
    try {
      console.log('�� Creating auth user with admin service...');
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Skip email confirmation
      });

      if (error) {
        console.error('❌ Auth user creation failed:', error);
        throw error;
      }

      console.log('✅ Auth user created successfully:', data.user.id);
      return { user: data.user, error: null };

    } catch (error: any) {
      console.error('❌ Admin service auth creation error:', error);
      throw error;
    }
  }

  /**
   * Create user profile with multiple fallback methods
   */
  static async createUserProfile(userId: string, role: 'admin' | 'employee' = 'employee') {
    try {
      console.log('📝 Creating user profile...', { userId, role });

      // Method 1: Try RPC function first
      try {
        const { data: rpcResult, error: rpcError } = await supabaseAdmin
          .rpc('create_user_profile', {
            user_id: userId,
            user_role: role
          });

        if (!rpcError && rpcResult?.success) {
          console.log('✅ User profile created via RPC function');
          return { 
            success: true, 
            profile: rpcResult, 
            method: 'rpc_function' 
          };
        }

        console.warn('⚠️ RPC function failed, trying direct insertion:', rpcError?.message);
      } catch (rpcError) {
        console.warn('⚠️ RPC function not available, trying direct insertion');
      }

      // Method 2: Direct table insertion
      try {
        const { data: profile, error: insertError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: userId,
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!insertError) {
          console.log('✅ User profile created via direct insertion');
          return { 
            success: true, 
            profile, 
            method: 'direct_insertion' 
          };
        }

        console.warn('⚠️ Direct insertion failed:', insertError.message);
      } catch (insertError) {
        console.warn('⚠️ Direct insertion not available');
      }

      // If all methods fail
      return { 
        success: false, 
        error: 'All profile creation methods failed',
        method: 'none' 
      };

    } catch (error: any) {
      console.error('❌ User profile creation failed:', error);
      return { 
        success: false, 
        error: error.message,
        method: 'error' 
      };
    }
  }

  /**
   * Delete auth user (cleanup on failures)
   */
  static async deleteAuthUser(userId: string) {
    try {
      console.log('🗑️ Deleting auth user for cleanup:', userId);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        console.error('❌ Failed to delete auth user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Auth user deleted successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Admin service delete user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test admin permissions
   */
  static async testAdminPermissions() {
    try {
      console.log('🔍 Testing admin permissions...');

      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error('❌ Admin permissions test failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Admin permissions verified');
      return { success: true, userCount: data.users.length };

    } catch (error: any) {
      console.error('❌ Admin permissions test error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate user creation data
   */
  static async validateUserCreationData(email: string, password: string) {
    try {
      // Basic validation
      if (!email || !email.trim()) {
        return { valid: false, error: 'Email is required' };
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { valid: false, error: 'Invalid email format' };
      }

      if (!password || password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
      }

      return { valid: true };

    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
}