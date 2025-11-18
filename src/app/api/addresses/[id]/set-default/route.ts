import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { addresses, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication: Extract and verify Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify session token
    const userSession = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (userSession.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = userSession[0].userId;

    // Check if session is expired
    if (userSession[0].expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID parameter
    const addressId = params.id;
    if (!addressId || isNaN(parseInt(addressId))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Verify address exists and belongs to authenticated user
    const existingAddress = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, parseInt(addressId)),
          eq(addresses.userId, userId)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Transaction logic:
    // 1. Set all user's addresses to isDefault = false
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));

    // 2. Set specified address to isDefault = true
    const updatedAddress = await db
      .update(addresses)
      .set({ isDefault: true })
      .where(
        and(
          eq(addresses.id, parseInt(addressId)),
          eq(addresses.userId, userId)
        )
      )
      .returning();

    if (updatedAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Return the updated address with boolean conversion for isDefault
    const responseAddress = {
      ...updatedAddress[0],
      isDefault: Boolean(updatedAddress[0].isDefault)
    };

    return NextResponse.json(responseAddress, { status: 200 });

  } catch (error) {
    console.error('PUT /api/addresses/[id]/set-default error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}