import { NextRequest, NextResponse } from 'next/server';
import { supabaseAsUser, getUserFromRequest } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { user, token } = await getUserFromRequest(request);
    if (!user || !token) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { product_id, quantity } = body as { product_id?: string; quantity?: number };

    // Validate required fields
    if (!product_id || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    const sb = supabaseAsUser(token);
    const { data: product, error: prodErr } = await sb
      .from('products')
      .select('id, name, image_url, weight, price')
      .eq('id', product_id)
      .maybeSingle();
    if (prodErr) {
      console.error('Product fetch error:', prodErr);
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }
    if (!product) {
      return NextResponse.json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' }, { status: 404 });
    }

    // Upsert item in user's cart_items
    const { data: existing, error: existErr } = await sb
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();
    if (existErr && existErr.code !== 'PGRST116') {
      // ignore not-found error style; otherwise fail
      console.error('Cart item lookup error:', existErr);
    }

    let cartItemRow: any;
    let statusCode = 201;
    if (existing) {
      const { data: updated, error: updErr } = await sb
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select('id, quantity')
        .single();
      if (updErr) {
        console.error('Update cart item error:', updErr);
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      cartItemRow = updated;
      statusCode = 200;
    } else {
      const { data: inserted, error: insErr } = await sb
        .from('cart_items')
        .insert({ user_id: user.id, product_id, quantity })
        .select('id, quantity')
        .single();
      if (insErr) {
        console.error('Insert cart item error:', insErr);
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      cartItemRow = inserted;
    }

    // Return cart item with product details
    return NextResponse.json(
      {
        id: cartItemRow.id,
        cartId: 0,
        productId: product.id,
        quantity: cartItemRow.quantity,
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.image_url ?? '',
          quantity: product.weight ?? '',
          price: Number(product.price ?? 0),
          deliveryTime: '8 mins',
        },
        createdAt: null,
        updatedAt: null,
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error('POST /api/cart/items error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}