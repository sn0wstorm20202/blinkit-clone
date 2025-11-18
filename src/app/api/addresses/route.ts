import { NextRequest, NextResponse } from 'next/server';
import { supabaseAsUser, getUserFromRequest } from '@/lib/supabase/admin';

async function authenticateRequest(request: NextRequest) {
  const { user, token } = await getUserFromRequest(request);
  if (!user || !token) return null;
  return { user, token } as const;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const supabase = supabaseAsUser(auth.token);
    const { data, error } = await supabase
      .from('addresses')
      .select('id, user_id, full_name, phone_number, address_line1, address_line2, city, state, postal_code, is_default, created_at')
      .eq('user_id', auth.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Addresses fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (data ?? []).map((addr: any) => ({
      id: addr.id,
      userId: addr.user_id,
      fullName: addr.full_name,
      phoneNumber: addr.phone_number,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      isDefault: Boolean(addr.is_default),
      createdAt: addr.created_at,
    }));

    return NextResponse.json(formatted, { status: 200 });

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
    const auth = await authenticateRequest(request);
    
    if (!auth) {
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

    const supabase = supabaseAsUser(auth.token);
    if (isDefault) {
      const { error: clearErr } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', auth.user.id);
      if (clearErr) {
        console.error('Clear default error:', clearErr);
      }
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: auth.user.id,
        full_name: fullName,
        phone_number: phoneNumber,
        address_line1: addressLine1,
        address_line2: addressLine2Value,
        city: cityValue,
        state: stateValue,
        postal_code: postalCode,
        is_default: isDefault,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Create address error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedAddress = {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      phoneNumber: data.phone_number,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      isDefault: Boolean(data.is_default),
      createdAt: data.created_at,
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