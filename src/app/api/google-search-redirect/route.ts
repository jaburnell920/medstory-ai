import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Resolve the final destination URL so we can bypass Google's redirect notice
async function resolveLuckyDestination(query: string): Promise<string | null> {
  const luckyUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`;
  let currentUrl = luckyUrl;

  for (let i = 0; i < 5; i++) {
    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Referer: 'https://www.google.com/',
      } as Record<string, string>,
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (!loc) return null;

      const nextUrl = new URL(loc, 'https://www.google.com');

      if (nextUrl.hostname.endsWith('google.com')) {
        if (nextUrl.pathname === '/url' || nextUrl.pathname === '/url/') {
          const trueUrl = nextUrl.searchParams.get('url') || nextUrl.searchParams.get('q');
          if (trueUrl) return trueUrl;
        }
        currentUrl = nextUrl.toString();
        continue;
      }

      return nextUrl.toString();
    } else if (res.status === 200) {
      // Rare: received HTML instead of a redirect. Try to detect meta/JS redirects.
      try {
        const text = await res.text();
        const metaMatch = text.match(/http-equiv=["']refresh["'][^>]*url=([^"'>]+)/i) || text.match(/URL=([^"'>]+)/i);
        if (metaMatch && metaMatch[1]) {
          try {
            const candidate = decodeURIComponent(metaMatch[1]);
            if (candidate.startsWith('http')) return candidate;
          } catch {}
        }
        const jsMatch = text.match(/window\\.location(?:\\.href)?\s*=\s*['"]([^'\"]+)['"]/i);
        if (jsMatch && jsMatch[1] && jsMatch[1].startsWith('http')) return jsMatch[1];
      } catch {}
      return null;
    } else {
      return null;
    }
  }

  return null;
}


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }


  // Attempt to resolve the final destination first to bypass Google's redirect notice
  try {
    const resolved = await resolveLuckyDestination(query);
    if (resolved) {
      return NextResponse.redirect(resolved);
    }
  } catch {
    // Ignore and fall back to standard approach below
  }

  // Fallback: regular Google search results to avoid interstitials
  const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return NextResponse.redirect(fallbackUrl);
}