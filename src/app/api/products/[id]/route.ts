import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'ID is required', code: 'INVALID_ID' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('products')
      .select('id,name,image_url,weight,price,created_at,category_id,categories(name)')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('Supabase product error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        {
          error: 'Product not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const result = {
      id: data.id,
      name: data.name,
      categoryId: data.category_id,
      categoryName: (data as any).categories?.name ?? null,
      imageUrl: data.image_url ?? '',
      quantity: data.weight ?? '',
      price: Number(data.price ?? 0),
      deliveryTime: '8 mins',
      createdAt: data.created_at,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET product error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}