import { NextRequest, NextResponse } from 'next/server';
import { testAssignmentsService } from '../../../lib/services/testAssignmentsService';

export async function POST(request: NextRequest) {
  try {
    const { updates } = await request.json();
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Updates array is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Batch updating assignments:', updates.length);

    const results = [];
    const errors = [];

    // Process updates in batches to avoid overwhelming the database
    for (const update of updates) {
      try {
        const result = await testAssignmentsService.updateAssignment(update.id, {
          status: update.status,
          notes: update.notes,
          completed_at: update.status === 'completed' ? new Date().toISOString() : null
        });
        results.push(result);
      } catch (error: any) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;

    if (errorCount > 0) {
      console.warn(`⚠️ Batch update partial success: ${successCount} succeeded, ${errorCount} failed`);
    } else {
      console.log(`✅ Batch update complete: ${successCount} assignments updated`);
    }

    return NextResponse.json({ 
      success: errorCount === 0,
      data: {
        successCount,
        errorCount,
        results,
        errors
      },
      message: errorCount === 0 
        ? `${successCount} assignments updated successfully` 
        : `${successCount} succeeded, ${errorCount} failed`
    });

  } catch (error: any) {
    console.error('❌ API: Error in batch update:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to batch update assignments' },
      { status: 500 }
    );
  }
}