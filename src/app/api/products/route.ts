import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate and set pagination parameters
    let limit = 50;
    let offset = 0;

    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { 
            error: 'Invalid limit parameter. Must be a positive integer.',
            code: 'INVALID_LIMIT' 
          },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, 100);
    }

    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { 
            error: 'Invalid offset parameter. Must be a non-negative integer.',
            code: 'INVALID_OFFSET' 
          },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // Validate category_id if provided
    if (categoryId && (isNaN(parseInt(categoryId)) || parseInt(categoryId) < 1)) {
      return NextResponse.json(
        { 
          error: 'Invalid category_id parameter. Must be a positive integer.',
          code: 'INVALID_CATEGORY_ID' 
        },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [];

    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }

    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }

    // Build and execute query with LEFT JOIN to categories
    let query = db
      .select({
        id: products.id,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        imageUrl: products.imageUrl,
        quantity: products.quantity,
        price: products.price,
        deliveryTime: products.deliveryTime,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET products error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}