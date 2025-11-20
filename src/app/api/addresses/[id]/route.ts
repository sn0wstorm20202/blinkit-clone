import { NextRequest, NextResponse } from 'next/server';
import { supabaseAsUser, getUserFromRequest } from '@/lib/supabase/admin';

async function authenticateRequest(request: NextRequest): Promise<string | null> {
  try {
    const { user, token } = await getUserFromRequest(request);
    if (!user || !token) {
      return null;
    }
    return user.id;
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
    const { user, token } = await getUserFromRequest(request);
    if (!user || !token) {
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
    const sb = supabaseAsUser(token);

    const { data: existing, error: exErr } = await sb
      .from('addresses')
      .select('*')
      .eq('id', addressId)
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
    } = body || {};

    const updates: Record<string, any> = {};
    if (full_name !== undefined) updates.full_name = String(full_name).trim();
    if (phone_number !== undefined) updates.phone_number = String(phone_number).trim();
    if (address_line1 !== undefined) updates.address_line1 = String(address_line1).trim();
    if (address_line2 !== undefined) updates.address_line2 = address_line2 ? String(address_line2).trim() : null;
    if (city !== undefined) updates.city = String(city).trim();
    if (state !== undefined) updates.state = String(state).trim();
    if (postal_code !== undefined) updates.postal_code = String(postal_code).trim();
    if (is_default !== undefined) updates.is_default = Boolean(is_default);

    if (updates.is_default === true) {
      const { error: clearErr } = await sb
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      if (clearErr) {
        console.error('Clear default error:', clearErr);
      }
    }

    const { data: updated, error: updErr } = await sb
      .from('addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select('*')
      .single();
    if (updErr || !updated) {
      return NextResponse.json(
        { error: updErr?.message || 'Failed to update address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
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
    const { user, token } = await getUserFromRequest(request);
    if (!user || !token) {
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
    const sb = supabaseAsUser(token);

    const { data: existing, error: exErr } = await sb
      .from('addresses')
      .select('id')
      .eq('id', addressId)
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

    const { data: deleted, error: delErr } = await sb
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select('id')
      .single();
    if (delErr || !deleted) {
      return NextResponse.json(
        { error: delErr?.message || 'Failed to delete address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Address deleted successfully',
      addressId: deleted.id
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}