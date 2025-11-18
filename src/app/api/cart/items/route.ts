import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cart, cartItems, products, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify session and get userId
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // Check if session has expired
    if (new Date(userSession.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Parse and validate request body
    const body = await request.json();
    const { product_id, quantity } = body;

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

    // Verify product exists
    const productRecord = await db
      .select()
      .from(products)
      .where(eq(products.id, product_id))
      .limit(1);

    if (productRecord.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const product = productRecord[0];

    // Find or create user's cart
    let userCart = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .limit(1);

    const now = new Date().toISOString();

    if (userCart.length === 0) {
      // Create new cart for user
      const newCart = await db
        .insert(cart)
        .values({
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      userCart = newCart;
    }

    const cartId = userCart[0].id;

    // Check if product already exists in cart
    const existingCartItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, product_id)
        )
      )
      .limit(1);

    let cartItem;
    let statusCode;

    if (existingCartItem.length > 0) {
      // Update existing cart item quantity
      const updated = await db
        .update(cartItems)
        .set({
          quantity: existingCartItem[0].quantity + quantity,
          updatedAt: now,
        })
        .where(eq(cartItems.id, existingCartItem[0].id))
        .returning();

      cartItem = updated[0];
      statusCode = 200;
    } else {
      // Insert new cart item
      const inserted = await db
        .insert(cartItems)
        .values({
          cartId,
          productId: product_id,
          quantity,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      cartItem = inserted[0];
      statusCode = 201;
    }

    // Update cart's updatedAt timestamp
    await db
      .update(cart)
      .set({ updatedAt: now })
      .where(eq(cart.id, cartId));

    // Return cart item with product details
    return NextResponse.json(
      {
        id: cartItem.id,
        cartId: cartItem.cartId,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          quantity: product.quantity,
          price: product.price,
          deliveryTime: product.deliveryTime,
        },
        createdAt: cartItem.createdAt,
        updatedAt: cartItem.updatedAt,
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