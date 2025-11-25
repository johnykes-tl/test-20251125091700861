import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '../../lib/services/dashboardService';
import { diagnosticsService } from '../../lib/services/diagnosticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats_only = searchParams.get('stats_only') === 'true';
    const health_check = searchParams.get('health_check') === 'true';

    console.log('🚀 API: Loading dashboard data');

    if (health_check) {
      const health = await diagnosticsService.performHealthCheck();
      return NextResponse.json({ 
        success: true, 
        data: { health }
      });
    } else if (stats_only) {
      const data = await dashboardService.getDashboardPageData();
      return NextResponse.json({ 
        success: true, 
        data: { stats: data.stats }
      });
    } else {
      const data = await dashboardService.getDashboardPageData();
      return NextResponse.json({ 
        success: true, 
        data 
      });
    }
  } catch (error: any) {
    console.error('❌ API: Error loading dashboard data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}