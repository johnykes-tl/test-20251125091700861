import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAdminService } from '../../../lib/supabase-admin';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Environment Check (Import Path Fixed):', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  urlValue: supabaseUrl,
  serviceKeyPrefix: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING',
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: Create user request received (Import Path Fixed)');
    
    // Enhanced environment validation
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error: Missing Supabase credentials',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }

    // Check for common configuration mistakes
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseServiceKey === anonKey) {
      console.error('❌ Service role key is same as anon key');
      return NextResponse.json(
        { 
          error: 'CONFIGURATION ERROR: Service role key is identical to anon key',
          troubleshooting: {
            issue: 'Using anon key instead of service role key',
            solution: 'Verify you copied the SERVICE ROLE key (not anon key) from Supabase Dashboard',
            dashboardUrl: `https://supabase.com/dashboard/project/ctlfkelrjpjflfbdfyxp/settings/api`
          }
        },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();
    
    console.log('👤 Creating user account via enhanced API route:', { email });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Step 1: Validate user creation data (always works)
    console.log('🔍 Validating user creation data...');
    const validation = await SupabaseAdminService.validateUserCreationData(email, password);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Step 2: Test admin permissions
    console.log('🔍 Testing admin permissions...');
    const permissionTest = await SupabaseAdminService.testAdminPermissions();
    
    if (!permissionTest.success) {
      console.error('❌ Admin permission test failed:', permissionTest.error);
      
      return NextResponse.json(
        { 
          error: 'PERMISSION ERROR: Service role key lacks admin privileges',
          troubleshooting: {
            currentError: permissionTest.error,
            serviceKeyUsed: supabaseServiceKey.substring(0, 20) + '...',
            possibleCauses: [
              'Service role key is incorrect',
              'Development server needs restart',
              'Environment variable cache issue'
            ],
            nextSteps: [
              'Stop dev server (Ctrl+C)',
              'Run: npm run dev',
              'Verify service role key in Supabase Dashboard',
              'Check browser Network tab for actual key being sent'
            ]
          }
        },
        { status: 403 }
      );
    }

    console.log('✅ Admin permissions verified');

    // Step 3: Create auth user
    console.log('�� Creating auth user...');
    const { user: authUser, error: authError } = await SupabaseAdminService.createAuthUser(email, password);

    if (authError) {
      console.error('❌ Auth user creation failed:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      });
      
      // Enhanced error handling
      if (authError.status === 401) {
        return NextResponse.json(
          { 
            error: 'AUTHENTICATION ERROR: Invalid service role key',
            troubleshooting: {
              issue: 'Service role key is not valid',
              currentKey: supabaseServiceKey.substring(0, 20) + '...',
              solution: 'Double-check the service role key from Supabase Dashboard',
              dashboardUrl: `https://supabase.com/dashboard/project/ctlfkelrjpjflfbdfyxp/settings/api`
            }
          },
          { status: 401 }
        );
      }

      if (authError.status === 403 || authError.code === 'not_admin') {
        return NextResponse.json(
          { 
            error: 'AUTHORIZATION ERROR: Insufficient privileges',
            troubleshooting: {
              currentError: 'not_admin / User not allowed',
              serviceKeyTest: 'Service role key format appears correct but lacks admin privileges',
              immediateActions: [
                'Restart development server',
                'Verify service role key in Supabase Dashboard',
                'Check browser Network tab to verify correct key is sent'
              ]
            }
          },
          { status: 403 }
        );
      }
      
      if (authError.message?.includes('User already registered')) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Failed to create user account: ${authError.message}`,
          details: {
            status: authError.status,
            code: authError.code
          }
        },
        { status: 400 }
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'User creation returned no user data' },
        { status: 400 }
      );
    }

    console.log('✅ Auth user created successfully:', { userId: authUser.id });

    // Step 4: Create user profile (with multiple fallback methods)
    console.log('📝 Creating user profile...');
    const profileResult = await SupabaseAdminService.createUserProfile(authUser.id, 'employee');

    if (!profileResult.success) {
      console.error('❌ User profile creation failed:', profileResult.error);
      
      // Clean up auth user
      console.log('🧹 Cleaning up auth user after profile creation failure...');
      const cleanup = await SupabaseAdminService.deleteAuthUser(authUser.id);
      
      if (!cleanup.success) {
        console.error('⚠️ Failed to cleanup auth user:', cleanup.error);
      }
      
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileResult.error}` },
        { status: 400 }
      );
    }

    console.log('✅ User account and profile created successfully:', { 
      userId: authUser.id,
      email: authUser.email,
      method: profileResult.method
    });

    return NextResponse.json({
      user: authUser,
      profile: profileResult.profile,
      success: true,
      message: `User created successfully with employee role (method: ${profileResult.method})`,
      details: {
        method: profileResult.method,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ API route error:', error);
    
    return NextResponse.json(
      { 
        error: `Server error: ${error.message}`,
        details: {
          errorName: error.name,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}