import { NextRequest, NextResponse } from 'next/server';
import { userDataValidator } from '../../../lib/validation/userDataValidator';

export async function POST(request: NextRequest) {
  try {
    const { field, value, excludeUserId } = await request.json();

    if (!field || !value) {
      return NextResponse.json(
        { success: false, error: 'Field and value are required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Checking duplicates', { field, value: value.substring(0, 10) + '...' });

    let result: any = { isDuplicate: false };

    switch (field) {
      case 'email':
        result = await userDataValidator.checkDuplicateEmail(value, excludeUserId);
        break;
      case 'phone':
        result = await userDataValidator.checkDuplicatePhone(value, excludeUserId);
        break;
      case 'name':
        result = await userDataValidator.checkSimilarNames(value, excludeUserId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid field for duplicate check' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        field,
        isDuplicate: result.isDuplicate || result.hasSimilar || false,
        existingUser: result.existingUser || null,
        similarUsers: result.similarUsers || null
      }
    });

  } catch (error: any) {
    console.error('❌ API: Error checking duplicates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}