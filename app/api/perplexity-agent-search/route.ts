import { NextRequest, NextResponse } from 'next/server';

const APPROVED_DOMAINS = [
  'calmatters.org',
  'digitaldemocracy.calmatters.org',
  'web.archive.org',
  'lexisnexis.com',
  'pacer.uscourts.gov',
  'pacer.gov',
  'docs.google.com',
  'helpx.adobe.com',
  'lightroom.adobe.com',
  'openai.com',
  'documentcloud.org',
  'muckrock.com',
  'propublica.org',
  'revealnews.org',
  'apnews.com',
  'reuters.com',
];

interface AgentAnnotation {
  type: string;
  url?: string;
  title?: string;
  start_index?: number;
  end_index?: number;
}

interface AgentContentItem {
  type: string;
  text?: string;
  annotations?: AgentAnnotation[];
}

interface AgentOutputItem {
  type: string;
  role?: string;
  content?: AgentContentItem[];
}

interface AgentResponse {
  status?: string;
  output?: AgentOutputItem[];
  error?: { message?: string };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query: string = body?.query ?? '';
  const fileContext: string | undefined = body?.fileContext;

  if (!query.trim()) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Perplexity API key not configured' }, { status: 500 });
  }

  const instructions = fileContext
    ? `You are a research assistant for journalists. The user is working with a file whose content begins with:\n\n${fileContext.slice(0, 2000)}\n\nAnswer concisely and accurately based on search results, focusing on sources related to both this file's content and the query. Cite your sources inline. Focus on factual information from the allowed domains.`
    : 'You are a research assistant for journalists. Answer concisely and accurately based on search results. Cite your sources inline. Focus on factual information from the allowed domains.';

  try {
    const res = await fetch('https://api.perplexity.ai/v1/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1',
        input: query,
        instructions,
        tools: [
          {
            type: 'web_search',
            filters: {
              search_domain_filter: APPROVED_DOMAINS,
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Perplexity Agent API error:', errText);
      return NextResponse.json({ error: 'Perplexity Agent API request failed' }, { status: 502 });
    }

    const data = (await res.json()) as AgentResponse;

    if (data.error?.message) {
      console.error('Perplexity Agent error field:', data.error.message);
      return NextResponse.json({ error: data.error.message }, { status: 502 });
    }

    let answer = '';
    const sourceMap = new Map<string, string>();

    for (const item of data.output ?? []) {
      if (item.type === 'message' && item.role === 'assistant') {
        for (const contentItem of item.content ?? []) {
          if (contentItem.type === 'output_text' && contentItem.text) {
            answer += contentItem.text;
          }
          for (const ann of contentItem.annotations ?? []) {
            if (ann.url) {
              let domain = ann.url;
              try { domain = new URL(ann.url).hostname.replace('www.', ''); } catch { /* ignore */ }
              sourceMap.set(ann.url, ann.title ?? domain);
            }
          }
        }
      }
    }

    const sources = Array.from(sourceMap.entries()).map(([url, title]) => ({ url, title }));

    return NextResponse.json({ answer, sources });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Perplexity agent search error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
