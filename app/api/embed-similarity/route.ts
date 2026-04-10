import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface NodeInput {
  id: string;
  text: string;
}

interface SimilarityPair {
  from: string;
  to: string;
  score: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  let nodes: NodeInput[];
  try {
    const body = await req.json();
    nodes = body.nodes;
    if (!Array.isArray(nodes) || nodes.length < 2) {
      return NextResponse.json({ pairs: [] });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const threshold: number = 0.62;

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: nodes.map((n) => n.text),
      encoding_format: 'float'
    });

    const embeddings = response.data.map((d) => d.embedding);

    const pairs: SimilarityPair[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const score = cosineSimilarity(embeddings[i], embeddings[j]);
        if (score >= threshold) {
          pairs.push({ from: nodes[i].id, to: nodes[j].id, score });
        }
      }
    }

    // Sort by score descending, cap at 20 connections to avoid clutter
    pairs.sort((a, b) => b.score - a.score);

    return NextResponse.json({ pairs: pairs.slice(0, 20) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Embedding error';
    console.error('Embed similarity error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
