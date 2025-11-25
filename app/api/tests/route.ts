import { NextRequest, NextResponse } from 'next/server';
import { testsService } from '../../lib/services/testsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats_only = searchParams.get('stats_only') === 'true';

    console.log('🚀 API: Loading tests data', { stats_only });

    if (stats_only) {
      const stats = await testsService.getTestStats();
      return NextResponse.json({ success: true, data: stats });
    } else {
      const tests = await testsService.getTests();
      return NextResponse.json({ success: true, data: tests });
    }

  } catch (error: any) {
    console.error('❌ API: Error loading tests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const testData = await request.json();
    console.log('🚀 API: Creating test', { title: testData.title });

    const result = await testsService.createTest(testData);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Test created successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error creating test:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create test' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id');
    
    if (!testId) {
      return NextResponse.json(
        { success: false, error: 'Test ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    console.log('🚀 API: Updating test', { testId });

    const result = await testsService.updateTest(testId, updateData);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Test updated successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error updating test:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update test' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id');
    
    if (!testId) {
      return NextResponse.json(
        { success: false, error: 'Test ID is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Deleting test', { testId });

    await testsService.deleteTest(testId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Test deleted successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error deleting test:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete test' },
      { status: 500 }
    );
  }
}