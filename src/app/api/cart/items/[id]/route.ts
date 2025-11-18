import { NextRequest, NextResponse } from 'next/server';
import { supabaseAsUser, getUserFromRequest } from '@/lib/supabase/admin';

async function requireAuth(request: NextRequest) {
  const { user, token } = await getUserFromRequest(request);
  if (!user || !token) return null;
  return { user, token } as const;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Quantity is required', code: 'MISSING_QUANTITY' },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    const sb = supabaseAsUser(auth.token);
    const { data: item, error: itemErr } = await sb
      .from('cart_items')
      .select('id, product_id')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (itemErr) {
      console.error('Fetch cart item error:', itemErr);
    }
    if (!item) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { data: updated, error: updErr } = await sb
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select('id, product_id, quantity')
      .single();
    if (updErr) {
      console.error('Update cart item error:', updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const { data: product, error: prodErr } = await sb
      .from('products')
      .select('id, name, image_url, weight, price')
      .eq('id', updated.product_id)
      .maybeSingle();
    if (prodErr || !product) {
      return NextResponse.json({ error: prodErr?.message || 'Product not found', code: 'PRODUCT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      cartId: 0,
      productId: updated.product_id,
      quantity: updated.quantity,
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.image_url ?? '',
        quantity: product.weight ?? '',
        price: Number(product.price ?? 0)
      },
      updatedAt: null
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
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    const sb = supabaseAsUser(auth.token);
    const { data: deleted, error: delErr } = await sb
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select('id')
      .single();
    if (delErr) {
      console.error('Delete cart item error:', delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Item removed from cart successfully',
      cartItemId: deleted.id
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}