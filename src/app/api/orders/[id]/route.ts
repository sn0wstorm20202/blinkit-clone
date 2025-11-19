import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, supabaseAsUser } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, token } = await getUserFromRequest(request);
    if (!user || !token) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Validate ID parameter
    const orderId = await params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: 'Valid order ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    const sb = supabaseAsUser(token);
    const { data: order, error: ordErr } = await sb
      .from('orders')
      .select('id, user_id, total_amount, status, created_at, delivery_address')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (ordErr) {
      console.error('Order fetch error:', ordErr);
    }
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    // Get order items with product details
    const { data: items, error: itemsErr } = await sb
      .from('order_items')
      .select('id, order_id, product_id, quantity, price_at_time, created_at, product:products(id, name, image_url, weight)')
      .eq('order_id', orderId);
    if (itemsErr) {
      console.error('Order items fetch error:', itemsErr);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    // Format response
    const response = {
      id: order.id,
      userId: order.user_id,
      addressId: null,
      address: {
        id: null,
        fullName: (order as any).delivery_address?.fullName,
        phoneNumber: (order as any).delivery_address?.phoneNumber,
        addressLine1: (order as any).delivery_address?.addressLine1,
        addressLine2: (order as any).delivery_address?.addressLine2,
        city: (order as any).delivery_address?.city,
        state: (order as any).delivery_address?.state,
        postalCode: (order as any).delivery_address?.postalCode,
      },
      items: (items ?? []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        priceAtPurchase: Number(item.price_at_time ?? 0),
        product: {
          id: item.product?.id,
          name: item.product?.name,
          imageUrl: item.product?.image_url ?? '',
          quantity: item.product?.weight ?? '',
          deliveryTime: '8 mins',
        },
        createdAt: item.created_at,
      })),
      totalAmount: Number(order.total_amount ?? 0),
      deliveryCharge: 15,
      handlingCharge: 5,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.created_at,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET order detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}