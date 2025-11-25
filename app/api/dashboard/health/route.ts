import { NextRequest, NextResponse } from 'next/server';
import { diagnosticsService } from '../../../lib/services/diagnosticsService';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API: Running system health check');

    const healthCheck = await diagnosticsService.performHealthCheck();
    
    return NextResponse.json({ 
      success: true, 
      data: { health: healthCheck } 
    });

  } catch (error: any) {
    console.error('❌ API: Error running health check:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to run health check' },
      { status: 500 }
    );
  }
}