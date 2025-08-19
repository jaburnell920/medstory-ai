import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Use Google's "I'm Feeling Lucky" feature which automatically redirects to the first search result
    // This is more reliable than scraping search results and doesn't violate ToS
    const luckyUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`;
    
    // Redirect to Google's "I'm Feeling Lucky" search
    return NextResponse.redirect(luckyUrl);
    
  } catch (error) {
    console.error('Error with Google search redirect:', error);
    // Fallback to regular Google search
    const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return NextResponse.redirect(fallbackUrl);
  }
}