import { NextRequest, NextResponse } from 'next/server';
import { simpleSettingsService } from '../../../lib/services/simpleSettingsService';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API: Initializing default settings');

    // Validate environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables for settings initialization');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error: Missing Supabase credentials' 
        },
        { status: 500 }
      );
    }

    // Test connection before attempting initialization
    const connectionTest = await simpleSettingsService.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Database connection failed for settings initialization:', connectionTest.message);
      return NextResponse.json(
        { 
          success: false, 
          error: `Database connection failed: ${connectionTest.message}` 
        },
        { status: 503 }
      );
    }

    // Initialize default settings
    const result = await simpleSettingsService.initializeDefaults();
    
    console.log('✅ API: Default settings initialized successfully');
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Default settings initialized successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error initializing defaults:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide detailed error information
    let errorMessage = error.message || 'Failed to initialize default settings';
    let statusCode = 500;

    // Handle specific error types
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      errorMessage = 'Database tables not found. Please run migrations first.';
      statusCode = 503;
    } else if (error.message?.includes('permission denied')) {
      errorMessage = 'Database permission denied. Check service role key.';
      statusCode = 403;
    } else if (error.message?.includes('connect')) {
      errorMessage = 'Cannot connect to database. Check Supabase configuration.';
      statusCode = 503;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: {
          originalError: error.message,
          timestamp: new Date().toISOString(),
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      },
      { status: statusCode }
    );
  }
}