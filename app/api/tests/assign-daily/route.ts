import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { date } = body;
    const assignmentDate = date || new Date().toISOString().split('T')[0];

    console.log('🚀 API: Running daily test assignment (overwrite mode)', { assignmentDate });
    // Use service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

     // Enhanced logging for debugging
    console.log('📋 Before assignment - checking existing assignments...');
    const { data: existingAssignments, error: checkError } = await supabaseAdmin
      .from('test_assignments')
      .select('id, test_id, employee_id')
      .eq('assigned_date', assignmentDate);
    
    if (checkError) {
      console.error('❌ Error checking existing assignments:', checkError);
    } else {
      console.log(`📊 Found ${existingAssignments?.length || 0} existing assignments for ${assignmentDate}`);
    }
   // Call the database function with overwrite logic
    const { data, error } = await supabaseAdmin
      .rpc('assign_daily_tests', { target_date: assignmentDate });

     const { data: assignmentResult } = await supabaseAdmin
      .rpc('assign_daily_tests', { target_date: assignmentDate });

   if (error) {
      console.error('❌ Database assignment function failed:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Assignment function failed' },
        { status: 500 }
      );
    }

    console.log('✅ Daily test assignment completed:', assignmentResult);

    // Verify assignments were created/updated
    const { data: newAssignments, error: verifyError } = await supabaseAdmin
      .from('test_assignments')
      .select('id, test_id, employee_id, employee:employees(name)')
      .eq('assigned_date', assignmentDate);
    
    if (verifyError) {
      console.error('⚠️ Could not verify new assignments:', verifyError);
    } else {
      console.log(`✅ Verified: ${newAssignments?.length || 0} new assignments created`);
      newAssignments?.forEach((assignment: any) => {
        console.log(`👤 ${assignment.employee?.name} assigned to test ${assignment.test_id.slice(0, 8)}...`);
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        assignmentResult,
        assignmentDate,
        deletedCount: assignmentResult?.deleted_assignments || 0,
        createdCount: assignmentResult?.total_assignments_created || 0,
        newAssignments: newAssignments?.length || 0
      },
      message: `Daily test assignment completed: Deleted ${assignmentResult?.deleted_assignments || 0}, Created ${assignmentResult?.total_assignments_created || 0} new assignments`
    });

  } catch (error: any) {
    console.error('❌ API: Error in daily assignment:', error);
    return NextResponse.json(
         { 
          success: false, 
          error: error.message || 'Assignment function failed',
          details: error
        },
      { status: 500 }
    );
  }
}