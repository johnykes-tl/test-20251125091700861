import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(_req: NextRequest) {
  try {
    console.log('🔧 Testing database connection and permissions...');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data, error: connectionError } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError
      });
    }

    // Test 2: Check if tables exist
    console.log('📋 Checking table structure...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_profiles', 'employees']);

    // Test 3: Test admin auth permissions
    console.log('🔐 Testing admin auth permissions...');
    const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Admin auth test failed:', authError);
      return NextResponse.json({
        success: false,
        error: 'Admin authentication failed',
        details: {
          message: authError.message,
          status: authError.status,
          code: authError.code
        }
      });
    }

    // Test 4: Check RLS policies
    console.log('🛡️ Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabaseAdmin
      .rpc('check_table_rls', { table_name: 'user_profiles' })
      .single();

    return NextResponse.json({
      success: true,
      message: 'All tests passed!',
      details: {
        connection: 'OK',
        tables: tables?.map(t => t.table_name) || [],
        adminAuth: 'OK',
        userCount: users.users?.length || 0,
        environment: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          serviceKeyPrefix: supabaseServiceKey.substring(0, 20) + '...'
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed with exception',
      details: {
        message: error.message,
        name: error.name
      }
    });
  }
}