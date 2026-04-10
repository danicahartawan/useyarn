import { NextRequest, NextResponse } from 'next/server';
import Browserbase from '@browserbasehq/sdk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const numResults = parseInt(searchParams.get('n') ?? '10', 10);

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Browserbase API key not configured' }, { status: 500 });
  }

  try {
    const bb = new Browserbase({ apiKey });
    const searchResponse = await bb.search.web({
      query,
      numResults: Math.min(numResults, 20)
    });

    const results = (searchResponse.results ?? []).map((r) => ({
      id: r.id ?? r.url,
      url: r.url,
      title: r.title ?? 'Untitled',
      image: r.image ?? null,
      favicon: r.favicon ?? null,
      domain: (() => {
        try { return new URL(r.url).hostname.replace('www.', ''); } catch { return r.url; }
      })()
    }));

    return NextResponse.json({ results, query: searchResponse.query });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Browserbase search error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
