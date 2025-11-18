import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, supabaseAsUser } from '@/lib/supabase/admin';

async function authenticateRequest(request: NextRequest) {
  const { user, token } = await getUserFromRequest(request);
  if (!user || !token) return null;
  return { user, token } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const sb = supabaseAsUser(auth.token);
    const { data: ords, error } = await sb
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // item counts
    const orderIds = (ords ?? []).map((o: any) => o.id);
    let counts: Record<string, number> = {};
    if (orderIds.length) {
      const { data: itemsAgg, error: aggErr } = await sb
        .from('order_items')
        .select('order_id, count:quantity')
        .in('order_id', orderIds);
      if (!aggErr) {
        // quantity per row, sum per order
        for (const row of itemsAgg as any[]) {
          counts[row.order_id] = (counts[row.order_id] ?? 0) + Number(row.count ?? 0);
        }
      }
    }

    const response = (ords ?? []).map((o: any) => ({
      id: o.id,
      totalAmount: Number(o.total_amount ?? 0),
      deliveryCharge: 15,
      handlingCharge: 5,
      status: o.status ?? 'pending',
      createdAt: o.created_at,
      itemCount: counts[o.id] ?? 0,
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { address_id } = body;

    // Validate address_id is provided
    if (!address_id) {
      return NextResponse.json({ 
        error: 'Address ID is required',
        code: 'MISSING_ADDRESS' 
      }, { status: 400 });
    }

    // Validate address exists and belongs to user
    const sb = supabaseAsUser(auth.token);
    const { data: address, error: addrErr } = await sb
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (addrErr) {
      console.error('Address lookup error:', addrErr);
    }
    if (!address) {
      return NextResponse.json({ 
        error: 'Address not found',
        code: 'ADDRESS_NOT_FOUND' 
      }, { status: 404 });
    }

    // Get cart items with product details
    const { data: items, error: itemsErr } = await sb
      .from('cart_items')
      .select('id, quantity, product:products(id, name, image_url, weight, price)')
      .eq('user_id', auth.user.id);
    if (itemsErr) {
      console.error('Cart items error:', itemsErr);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    // Validate cart is not empty
    if (!items || items.length === 0) {
      return NextResponse.json({ 
        error: 'Cart is empty',
        code: 'EMPTY_CART' 
      }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.product?.price ?? 0) * item.quantity), 0);
    const deliveryCharge = 15;
    const handlingCharge = 5;
    const totalAmount = subtotal + deliveryCharge + handlingCharge;
    const now = new Date().toISOString();

    // Create order
    const { data: newOrder, error: orderErr } = await sb
      .from('orders')
      .insert({
        user_id: auth.user.id,
        total_amount: totalAmount,
        status: 'pending',
        delivery_address: {
          fullName: address.full_name,
          phoneNumber: address.phone_number,
          addressLine1: address.address_line1,
          addressLine2: address.address_line2,
          city: address.city,
          state: address.state,
          postalCode: address.postal_code,
        },
        created_at: now,
      })
      .select('*')
      .single();
    if (orderErr || !newOrder) {
      console.error('Create order error:', orderErr);
      return NextResponse.json({ error: orderErr?.message || 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItemsPayload = (items ?? []).map((it: any) => ({
      order_id: newOrder.id,
      product_id: it.product?.id,
      quantity: it.quantity,
      price_at_time: Number(it.product?.price ?? 0),
    }));

    const { data: createdOrderItems, error: oiErr } = await sb
      .from('order_items')
      .insert(orderItemsPayload)
      .select('*');
    if (oiErr) {
      console.error('Create order items error:', oiErr);
      return NextResponse.json({ error: oiErr.message }, { status: 500 });
    }

    // Clear cart items
    const { error: clearErr } = await sb
      .from('cart_items')
      .delete()
      .eq('user_id', auth.user.id);
    if (clearErr) {
      console.error('Clear cart items error:', clearErr);
    }

    const orderItemsWithProducts = (createdOrderItems ?? []).map((row: any) => {
      const ref = (items ?? []).find((i: any) => i.product?.id === row.product_id);
      return {
        id: row.id,
        orderId: row.order_id,
        productId: row.product_id,
        quantity: row.quantity,
        priceAtPurchase: Number(row.price_at_time ?? 0),
        product: {
          name: ref?.product?.name,
          imageUrl: ref?.product?.image_url ?? '',
          quantity: ref?.product?.weight ?? '',
        },
      };
    });

    const response = {
      id: newOrder.id,
      userId: auth.user.id,
      addressId: null,
      address: {
        fullName: address.full_name,
        phoneNumber: address.phone_number,
        addressLine1: address.address_line1,
        addressLine2: address.address_line2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
      },
      items: orderItemsWithProducts,
      totalAmount: Number(newOrder.total_amount ?? 0),
      deliveryCharge,
      handlingCharge,
      status: newOrder.status,
      createdAt: newOrder.created_at,
      updatedAt: newOrder.created_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST orders error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}