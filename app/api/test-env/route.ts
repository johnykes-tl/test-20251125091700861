import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing environment variables...');
    
    // Get all Supabase-related environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Create masked versions for security
    const maskedVars = {
      ...envVars,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? `${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
        : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: envVars.SUPABASE_SERVICE_ROLE_KEY 
        ? `${envVars.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` 
        : 'MISSING',
    };

    // Check which variables are missing
    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    // Get all environment keys that contain 'SUPABASE'
    const allSupabaseKeys = Object.keys(process.env).filter(_key => 
      _key.includes('SUPABASE')
    );

    const result = {
      success: missingVars.length === 0,
      environmentVariables: maskedVars,
      missingVariables: missingVars,
      allSupabaseKeys,
      diagnostics: {
        totalEnvVars: Object.keys(process.env).length,
        hasEnvFile: true, // We can't directly check .env.local from server
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      troubleshooting: missingVars.length > 0 ? {
        issue: `Missing ${missingVars.length} environment variable(s)`,
        missing: missingVars,
        steps: [
          '1. Verify .env.local exists in project root',
          '2. Stop development server (Ctrl+C)',
          '3. Start development server (npm run dev)',
          '4. Check variable names match exactly',
          '5. Ensure no extra spaces or quotes around values'
        ]
      } : null
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Environment test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      diagnostics: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  }
}