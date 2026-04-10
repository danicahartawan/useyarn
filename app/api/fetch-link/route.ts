import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchCanvas/1.0)' },
      signal: AbortSignal.timeout(8000)
    });
    const html = await res.text();

    const getMeta = (name: string): string => {
      const patterns = [
        new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return '';
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle =
      getMeta('og:title') || getMeta('twitter:title') || titleMatch?.[1]?.trim() || url;

    const rawDesc =
      getMeta('og:description') || getMeta('description') || getMeta('twitter:description') || '';

    const domain = new URL(url).hostname.replace(/^www\./, '');
    const title = rawTitle.length > 60 ? rawTitle.slice(0, 57) + '…' : rawTitle;
    const description = rawDesc.length > 120 ? rawDesc.slice(0, 117) + '…' : rawDesc;

    return NextResponse.json({ title, subtitle: domain, description, url });
  } catch (err) {
    console.error('fetch-link error:', err);
    // Fallback: return domain + url
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      return NextResponse.json({ title: url, subtitle: domain, description: '', url });
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }
}
