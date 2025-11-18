import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, cart, cartItems, products, addresses, session } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userSession = sessionRecord[0];
    
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
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Fetch user's orders with item count
    const userOrders = await db.select({
      id: orders.id,
      userId: orders.userId,
      addressId: orders.addressId,
      totalAmount: orders.totalAmount,
      deliveryCharge: orders.deliveryCharge,
      handlingCharge: orders.handlingCharge,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      itemCount: sql<number>`(SELECT COUNT(*) FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

    return NextResponse.json(userOrders, { status: 200 });
  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await authenticateRequest(request);
    if (!userId) {
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

    // Validate address_id is valid integer
    const addressId = parseInt(address_id);
    if (isNaN(addressId)) {
      return NextResponse.json({ 
        error: 'Valid Address ID is required',
        code: 'INVALID_ADDRESS' 
      }, { status: 400 });
    }

    // Validate address exists and belongs to user
    const userAddress = await db.select()
      .from(addresses)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, userId)
      ))
      .limit(1);

    if (userAddress.length === 0) {
      return NextResponse.json({ 
        error: 'Address not found',
        code: 'ADDRESS_NOT_FOUND' 
      }, { status: 404 });
    }

    // Get user's cart
    const userCart = await db.select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .limit(1);

    if (userCart.length === 0) {
      return NextResponse.json({ 
        error: 'Cart is empty',
        code: 'EMPTY_CART' 
      }, { status: 400 });
    }

    const cartId = userCart[0].id;

    // Get cart items with product details
    const items = await db.select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      price: products.price,
      productName: products.name,
      productImageUrl: products.imageUrl,
      productQuantity: products.quantity
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId));

    // Validate cart is not empty
    if (items.length === 0) {
      return NextResponse.json({ 
        error: 'Cart is empty',
        code: 'EMPTY_CART' 
      }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = 15;
    const handlingCharge = 5;
    const totalAmount = subtotal + deliveryCharge + handlingCharge;

    const now = new Date().toISOString();

    // Create order
    const newOrder = await db.insert(orders)
      .values({
        userId,
        addressId,
        totalAmount,
        deliveryCharge,
        handlingCharge,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const orderId = newOrder[0].id;

    // Create order items
    const orderItemsData = items.map(item => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.price,
      createdAt: now
    }));

    const createdOrderItems = await db.insert(orderItems)
      .values(orderItemsData)
      .returning();

    // Clear cart items
    await db.delete(cartItems)
      .where(eq(cartItems.cartId, cartId));

    // Build response with full order details
    const orderItemsWithProducts = createdOrderItems.map((item, index) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      product: {
        name: items[index].productName,
        imageUrl: items[index].productImageUrl,
        quantity: items[index].productQuantity
      }
    }));

    const response = {
      id: newOrder[0].id,
      userId: newOrder[0].userId,
      addressId: newOrder[0].addressId,
      address: {
        fullName: userAddress[0].fullName,
        phoneNumber: userAddress[0].phoneNumber,
        addressLine1: userAddress[0].addressLine1,
        addressLine2: userAddress[0].addressLine2,
        city: userAddress[0].city,
        state: userAddress[0].state,
        postalCode: userAddress[0].postalCode
      },
      items: orderItemsWithProducts,
      totalAmount: newOrder[0].totalAmount,
      deliveryCharge: newOrder[0].deliveryCharge,
      handlingCharge: newOrder[0].handlingCharge,
      status: newOrder[0].status,
      createdAt: newOrder[0].createdAt,
      updatedAt: newOrder[0].updatedAt
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST orders error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}