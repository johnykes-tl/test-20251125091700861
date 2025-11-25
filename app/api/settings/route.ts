import { NextRequest, NextResponse } from 'next/server';
import { simpleSettingsService } from '../../lib/services/simpleSettingsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const load_all = searchParams.get('load_all') === 'true';

    console.log('🚀 API: Loading settings', { load_all });

    if (load_all) {
      const data = await simpleSettingsService.loadAllSettings();
      return NextResponse.json({ success: true, data });
    } else {
      // Load specific settings if needed
      return NextResponse.json({ success: true, data: [] });
    }

  } catch (error: any) {
    console.error('❌ API: Error loading settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    console.log('🚀 API: Settings action', { action });

    let result;

    switch (action) {
      case 'create_timesheet_option':
        result = await simpleSettingsService.createTimesheetOption(data);
        break;
      case 'update_timesheet_option':
        result = await simpleSettingsService.updateTimesheetOption(data.id, data);
        break;
      case 'delete_timesheet_option':
        await simpleSettingsService.deleteTimesheetOption(data.id);
        result = { success: true };
        break;
      case 'toggle_timesheet_option':
        result = await simpleSettingsService.toggleTimesheetOption(data.id);
        break;
      case 'reorder_timesheet_options':
        await simpleSettingsService.reorderTimesheetOptions(data.id, data.direction);
        result = { success: true };
        break;
      case 'update_multiple_settings':
        await simpleSettingsService.updateMultipleSettings(data);
        result = { success: true };
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Setting action completed successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error in settings action:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to perform settings action' },
      { status: 500 }
    );
  }
}