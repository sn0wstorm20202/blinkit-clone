import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cart, cartItems, products, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function getUserFromToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessions = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const userSession = sessions[0];
    
    if (userSession.expiresAt < new Date()) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken(request);
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

    const cartItemId = parseInt(id);

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

    const existingCartItem = await db.select()
      .from(cartItems)
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (existingCartItem.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const cartId = existingCartItem[0].cartId;

    const userCart = await db.select()
      .from(cart)
      .where(and(
        eq(cart.id, cartId),
        eq(cart.userId, userId)
      ))
      .limit(1);

    if (userCart.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updatedAt = new Date().toISOString();

    const updatedCartItem = await db.update(cartItems)
      .set({
        quantity,
        updatedAt
      })
      .where(eq(cartItems.id, cartItemId))
      .returning();

    await db.update(cart)
      .set({ updatedAt })
      .where(eq(cart.id, cartId));

    const productDetails = await db.select()
      .from(products)
      .where(eq(products.id, updatedCartItem[0].productId))
      .limit(1);

    if (productDetails.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const product = productDetails[0];

    return NextResponse.json({
      id: updatedCartItem[0].id,
      cartId: updatedCartItem[0].cartId,
      productId: updatedCartItem[0].productId,
      quantity: updatedCartItem[0].quantity,
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity: product.quantity,
        price: product.price
      },
      updatedAt: updatedCartItem[0].updatedAt
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
    const userId = await getUserFromToken(request);
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

    const cartItemId = parseInt(id);

    const existingCartItem = await db.select()
      .from(cartItems)
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (existingCartItem.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const cartId = existingCartItem[0].cartId;

    const userCart = await db.select()
      .from(cart)
      .where(and(
        eq(cart.id, cartId),
        eq(cart.userId, userId)
      ))
      .limit(1);

    if (userCart.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(cartItems)
      .where(eq(cartItems.id, cartItemId))
      .returning();

    const updatedAt = new Date().toISOString();
    await db.update(cart)
      .set({ updatedAt })
      .where(eq(cart.id, cartId));

    return NextResponse.json({
      message: 'Item removed from cart successfully',
      cartItemId: deleted[0].id
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}