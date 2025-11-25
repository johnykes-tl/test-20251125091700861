import { NextRequest, NextResponse } from 'next/server';
import { reportsService } from '../../lib/services/reportsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Report type is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Loading reports data', { type, year, month, date });

    let data;

    switch (type) {
      case 'attendance':
        if (!year || !month) {
          return NextResponse.json(
            { success: false, error: 'Year and month are required for attendance report' },
            { status: 400 }
          );
        }
        data = await reportsService.getAttendanceReport(parseInt(year), parseInt(month));
        break;

      case 'leave':
        if (!year) {
          return NextResponse.json(
            { success: false, error: 'Year is required for leave report' },
            { status: 400 }
          );
        }
        data = await reportsService.getLeaveReport(parseInt(year));
        break;

      case 'summary':
        if (!year || !month) {
          return NextResponse.json(
            { success: false, error: 'Year and month are required for summary report' },
            { status: 400 }
          );
        }
        data = await reportsService.getDepartmentSummary(parseInt(year), parseInt(month));
        break;

      case 'timesheet':
        if (!date) {
          return NextResponse.json(
            { success: false, error: 'Date is required for timesheet report' },
            { status: 400 }
          );
        }
        data = await reportsService.getTimesheetReport(date);
        break;

      case 'stats':
        if (!year || !month) {
          return NextResponse.json(
            { success: false, error: 'Year and month are required for stats' },
            { status: 400 }
          );
        }
        data = await reportsService.getSummaryStats(parseInt(year), parseInt(month));
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load reports data' },
      { status: 500 }
    );
  }
}