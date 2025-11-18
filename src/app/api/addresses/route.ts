import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { addresses, session } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return null;
    }

    return userSession;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const userSession = await authenticateRequest(request);
    
    if (!userSession) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get all addresses for the authenticated user
    const userAddresses = await db.select()
      .from(addresses)
      .where(eq(addresses.userId, userSession.userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

    // Transform to match response structure with proper boolean conversion
    const formattedAddresses = userAddresses.map(addr => ({
      id: addr.id,
      userId: addr.userId,
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      isDefault: Boolean(addr.isDefault),
      createdAt: addr.createdAt
    }));

    return NextResponse.json(formattedAddresses, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const userSession = await authenticateRequest(request);
    
    if (!userSession) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['full_name', 'phone_number', 'address_line1', 'city', 'state', 'postal_code'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Required fields missing', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

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

    // Sanitize inputs
    const fullName = full_name.trim();
    const phoneNumber = phone_number.trim();
    const addressLine1 = address_line1.trim();
    const addressLine2Value = address_line2 ? address_line2.trim() : null;
    const cityValue = city.trim();
    const stateValue = state.trim();
    const postalCode = postal_code.trim();
    const isDefault = Boolean(is_default);

    // If this is set as default, update all other addresses to non-default
    if (isDefault) {
      await db.update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userSession.userId));
    }

    // Create new address
    const newAddress = await db.insert(addresses)
      .values({
        userId: userSession.userId,
        fullName,
        phoneNumber,
        addressLine1,
        addressLine2: addressLine2Value,
        city: cityValue,
        state: stateValue,
        postalCode,
        isDefault,
        createdAt: new Date().toISOString()
      })
      .returning();

    // Format response with proper boolean conversion
    const formattedAddress = {
      id: newAddress[0].id,
      userId: newAddress[0].userId,
      fullName: newAddress[0].fullName,
      phoneNumber: newAddress[0].phoneNumber,
      addressLine1: newAddress[0].addressLine1,
      addressLine2: newAddress[0].addressLine2,
      city: newAddress[0].city,
      state: newAddress[0].state,
      postalCode: newAddress[0].postalCode,
      isDefault: Boolean(newAddress[0].isDefault),
      createdAt: newAddress[0].createdAt
    };

    return NextResponse.json(formattedAddress, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}