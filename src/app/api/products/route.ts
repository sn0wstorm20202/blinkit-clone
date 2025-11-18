import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const categoryId = searchParams.get('category_id');
    const categoryName = searchParams.get('category_name');
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

    // Note: category_id is a UUID string when present; no further validation needed here

    const supabase = getSupabaseServer();

    let resolvedCategoryId: string | null = null;
    if (categoryId) {
      resolvedCategoryId = categoryId;
    } else if (categoryName) {
      const { data: cat, error: catErr } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', categoryName)
        .maybeSingle();
      if (catErr) {
        console.error('Category lookup error:', catErr);
      }
      resolvedCategoryId = cat?.id ?? null;
    }

    let query = supabase
      .from('products')
      .select('id,name,image_url,weight,price,created_at,category_id,categories(name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (resolvedCategoryId) {
      query = query.eq('category_id', resolvedCategoryId);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const to = offset + limit - 1;
    const { data, error } = await query.range(offset, Math.max(offset, to));
    if (error) {
      console.error('Supabase products error:', error);
      return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 });
    }

    const results = (data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      categoryId: p.category_id,
      categoryName: p.categories?.name ?? null,
      imageUrl: p.image_url ?? '',
      quantity: p.weight ?? '',
      price: Number(p.price ?? 0),
      deliveryTime: '8 mins',
      createdAt: p.created_at,
    }));

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