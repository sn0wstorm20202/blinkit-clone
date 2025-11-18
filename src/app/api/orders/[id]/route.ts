import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, addresses, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token and get user
    const userSession = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (userSession.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const authenticatedUserId = userSession[0].userId;

    // Check if session is expired
    const now = new Date();
    if (userSession[0].expiresAt < now) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID parameter
    const orderId = params.id;
    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json(
        { error: 'Valid order ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get order and verify ownership
    const order = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, parseInt(orderId)),
          eq(orders.userId, authenticatedUserId)
        )
      )
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get order items with product details
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        createdAt: orderItems.createdAt,
        productName: products.name,
        productImageUrl: products.imageUrl,
        productQuantity: products.quantity,
        productDeliveryTime: products.deliveryTime,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, parseInt(orderId)));

    // Get address details
    const address = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, order[0].addressId))
      .limit(1);

    if (address.length === 0) {
      return NextResponse.json(
        { error: 'Address not found for this order', code: 'ADDRESS_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      id: order[0].id,
      userId: order[0].userId,
      addressId: order[0].addressId,
      address: {
        id: address[0].id,
        fullName: address[0].fullName,
        phoneNumber: address[0].phoneNumber,
        addressLine1: address[0].addressLine1,
        addressLine2: address[0].addressLine2,
        city: address[0].city,
        state: address[0].state,
        postalCode: address[0].postalCode,
      },
      items: items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        product: {
          id: item.productId,
          name: item.productName,
          imageUrl: item.productImageUrl,
          quantity: item.productQuantity,
          deliveryTime: item.productDeliveryTime,
        },
        createdAt: item.createdAt,
      })),
      totalAmount: order[0].totalAmount,
      deliveryCharge: order[0].deliveryCharge,
      handlingCharge: order[0].handlingCharge,
      status: order[0].status,
      createdAt: order[0].createdAt,
      updatedAt: order[0].updatedAt,
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