import { NextRequest, NextResponse } from 'next/server';
import { ALL_TRUSTED_DOMAINS, SOURCE_CATEGORIES, PRIORITY_ORDERED_DOMAINS, matchesDomain } from '@/lib/sourceCategories';

interface ExaRawResult {
  id?: string;
  url: string;
  title?: string;
  text?: string;
  summary?: string;
  publishedDate?: string;
}

interface ExaApiResponse {
  results?: ExaRawResult[];
}

/**
 * Returns the exact domain-level priority index for a URL.
 * Lower = higher priority. Matches the spec-ordered list in sourceCategories.ts.
 * Falls back to PRIORITY_ORDERED_DOMAINS.length for unrecognized domains.
 */
function getDomainPriority(url: string): number {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const idx = PRIORITY_ORDERED_DOMAINS.findIndex((d) => matchesDomain(hostname, d));
    return idx === -1 ? PRIORITY_ORDERED_DOMAINS.length : idx;
  } catch {
    return PRIORITY_ORDERED_DOMAINS.length;
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const categoriesParam = searchParams.get('categories');

  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Exa API key not configured' }, { status: 500 });
  }

  let includeDomains: string[] = ALL_TRUSTED_DOMAINS;

  if (categoriesParam) {
    const selectedIds = categoriesParam.split(',').map((s) => s.trim()).filter(Boolean);
    const filtered = SOURCE_CATEGORIES
      .filter((c) => selectedIds.includes(c.id))
      .flatMap((c) => c.domains);
    if (filtered.length > 0) {
      includeDomains = filtered;
    }
  }

  try {
    const exaRes = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        query,
        numResults: 10,
        includeDomains,
        contents: {
          text: { maxCharacters: 300 }
        }
      })
    });

    if (!exaRes.ok) {
      const errText = await exaRes.text();
      console.error('Exa API error:', errText);
      return NextResponse.json({ error: 'Exa API request failed' }, { status: 502 });
    }

    const data = (await exaRes.json()) as ExaApiResponse;

    const results = (data.results ?? [])
      .map((r) => ({
        id: r.id ?? r.url,
        title: r.title ?? 'Untitled',
        url: r.url,
        snippet: r.text ?? r.summary ?? '',
        publishedDate: r.publishedDate ?? null,
        domain: extractDomain(r.url),
        _priority: getDomainPriority(r.url)
      }))
      .sort((a, b) => a._priority - b._priority)
      .map(({ _priority: _, ...rest }) => rest);

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Exa search error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
