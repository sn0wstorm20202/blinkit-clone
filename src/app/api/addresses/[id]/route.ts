import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { addresses, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const now = new Date();
    if (sessionRecord[0].expiresAt < now) {
      return null;
    }

    return sessionRecord[0].userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const addressId = parseInt(id);

    const existingAddress = await db.select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      full_name,
      phone_number,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      is_default
    } = body;

    const updates: Record<string, any> = {};

    if (full_name !== undefined) updates.fullName = full_name.trim();
    if (phone_number !== undefined) updates.phoneNumber = phone_number.trim();
    if (address_line1 !== undefined) updates.addressLine1 = address_line1.trim();
    if (address_line2 !== undefined) updates.addressLine2 = address_line2 ? address_line2.trim() : null;
    if (city !== undefined) updates.city = city.trim();
    if (state !== undefined) updates.state = state.trim();
    if (postal_code !== undefined) updates.postalCode = postal_code.trim();
    if (is_default !== undefined) updates.isDefault = is_default;

    if (is_default === true) {
      await db.update(addresses)
        .set({ isDefault: false })
        .where(and(
          eq(addresses.userId, userId),
          eq(addresses.isDefault, true)
        ));
    }

    const updated = await db.update(addresses)
      .set(updates)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updated[0].id,
      userId: updated[0].userId,
      fullName: updated[0].fullName,
      phoneNumber: updated[0].phoneNumber,
      addressLine1: updated[0].addressLine1,
      addressLine2: updated[0].addressLine2,
      city: updated[0].city,
      state: updated[0].state,
      postalCode: updated[0].postalCode,
      isDefault: Boolean(updated[0].isDefault),
      createdAt: updated[0].createdAt
    }, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const addressId = parseInt(id);

    const existingAddress = await db.select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Address deleted successfully',
      addressId: deleted[0].id
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}