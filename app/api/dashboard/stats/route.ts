import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '../../../lib/services/dashboardService';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API: Loading dashboard stats only');

    const data = await dashboardService.getDashboardPageData();
    
    return NextResponse.json({ 
      success: true, 
      data: { stats: data.stats } 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load dashboard stats' },
      { status: 500 }
    );
  }
}