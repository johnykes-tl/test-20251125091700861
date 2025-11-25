import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    console.log('🔧 Running server-side system diagnostic...');
    
    // Check server-side environment variables
    const serverEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    const missingVars = Object.entries(serverEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    const maskedVars = Object.fromEntries(
      Object.entries(serverEnvVars).map(([key, value]) => [
        key,
        value ? `${value.substring(0, 20)}...` : 'MISSING'
      ])
    );

    const environmentSuccess = missingVars.length === 0;

    // Additional server checks can be added here
    const additionalChecks = {
      nodeEnvironment: process.env.NODE_ENV || 'unknown',
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: environmentSuccess,
      environment: {
        variables: maskedVars,
        missingVars,
        allPresent: environmentSuccess,
        additionalInfo: additionalChecks
      },
      error: environmentSuccess ? null : `Missing server environment variables: ${missingVars.join(', ')}`,
      serverSide: true
    });

  } catch (error: any) {
    console.error('❌ Server diagnostic error:', error);
    return NextResponse.json({
      success: false,
      environment: null,
      error: `Server diagnostic failed: ${error.message}`,
      serverSide: true
    });
  }
}