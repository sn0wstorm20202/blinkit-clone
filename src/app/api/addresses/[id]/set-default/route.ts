import { NextRequest, NextResponse } from 'next/server';
import { supabaseAsUser, getUserFromRequest } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, token } = await getUserFromRequest(request);
    if (!user || !token) {
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

    const sb = supabaseAsUser(token);

    const { data: existing, error: exErr } = await sb
      .from('addresses')
      .select('id')
      .eq('id', parseInt(addressId))
      .eq('user_id', user.id)
      .maybeSingle();
    if (exErr) {
      console.error('Address lookup error:', exErr);
    }
    if (!existing) {
      return NextResponse.json(
        { error: 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Transaction logic:
    // 1. Set all user's addresses to isDefault = false
    const { error: clearErr } = await sb
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
    if (clearErr) {
      console.error('Clear default error:', clearErr);
    }

    // 2. Set specified address to isDefault = true
    const { data: updated, error: updErr } = await sb
      .from('addresses')
      .update({ is_default: true })
      .eq('id', parseInt(addressId))
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updErr || !updated) {
      return NextResponse.json(
        { error: updErr?.message || 'Address not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Return the updated address with boolean conversion for isDefault
    const responseAddress = {
      id: updated.id,
      userId: updated.user_id,
      fullName: updated.full_name,
      phoneNumber: updated.phone_number,
      addressLine1: updated.address_line1,
      addressLine2: updated.address_line2,
      city: updated.city,
      state: updated.state,
      postalCode: updated.postal_code,
      isDefault: Boolean(updated.is_default),
      createdAt: updated.created_at
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