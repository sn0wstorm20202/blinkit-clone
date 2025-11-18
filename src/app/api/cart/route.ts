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
        error: 'Unauthorized', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }
    const sb = supabaseAsUser(auth.token);
    const { data, error } = await sb
      .from('cart_items')
      .select('id, quantity, created_at, product:products(id, name, image_url, weight, price)')
      .eq('user_id', auth.user.id);
    if (error) {
      console.error('Cart fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      cartId: 0,
      productId: row.product?.id,
      quantity: row.quantity,
      product: {
        id: row.product?.id,
        name: row.product?.name,
        imageUrl: row.product?.image_url ?? '',
        quantity: row.product?.weight ?? '',
        price: Number(row.product?.price ?? 0),
        deliveryTime: '8 mins',
      },
    }));

    const totalAmount = items.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);
    const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return NextResponse.json({
      cartId: 0,
      userId: auth.user.id,
      items,
      totalAmount,
      itemCount,
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }
    const sb = supabaseAsUser(auth.token);
    const { data, error } = await sb
      .from('cart_items')
      .delete()
      .eq('user_id', auth.user.id)
      .select('id');
    if (error) {
      console.error('Cart clear error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      message: 'Cart cleared successfully',
      deletedCount: (data ?? []).length,
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}