import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/services/product-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';

  if (q.trim().length < 2) {
    return NextResponse.json({
      products: [],
      categories: [],
      querySuggestions: [],
    });
  }

  const suggestions = await getSearchSuggestions(q);
  return NextResponse.json(suggestions);
}
