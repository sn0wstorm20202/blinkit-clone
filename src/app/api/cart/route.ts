import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cart, cartItems, products, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessionResult = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return null;
    }

    const userSession = sessionResult[0];
    
    // Check if session is expired
    if (userSession.expiresAt < new Date()) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Find or create user's cart
    let userCart = await db.select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .limit(1);

    if (userCart.length === 0) {
      // Create new cart for user
      const newCart = await db.insert(cart)
        .values({
          userId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();
      
      userCart = newCart;
    }

    const cartId = userCart[0].id;

    // Get all cart items with product details
    const items = await db.select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      product: {
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        quantity: products.quantity,
        price: products.price,
        deliveryTime: products.deliveryTime
      }
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId));

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      cartId: cartId,
      userId: userId,
      items: items,
      totalAmount: totalAmount,
      itemCount: itemCount
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
    // Authenticate user
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Find user's cart
    const userCart = await db.select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .limit(1);

    if (userCart.length === 0) {
      return NextResponse.json({ 
        error: 'Cart not found', 
        code: 'CART_NOT_FOUND' 
      }, { status: 404 });
    }

    const cartId = userCart[0].id;

    // Delete all cart items
    const deleted = await db.delete(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .returning();

    return NextResponse.json({
      message: 'Cart cleared successfully',
      deletedCount: deleted.length
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}