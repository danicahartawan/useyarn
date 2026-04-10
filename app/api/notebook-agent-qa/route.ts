import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  let query: string;
  let fileName: string;
  let fileContent: string;
  try {
    const body = await req.json();
    query = body.query?.trim();
    fileName = body.fileName?.trim() ?? 'Unknown file';
    fileContent = body.fileContent?.trim() ?? '';
    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = fileContent
    ? `You are a helpful research assistant. The user is working with a file named "${fileName}". Here is its content:\n\n${fileContent.slice(0, 3000)}\n\nAnswer questions about this file clearly and concisely.`
    : `You are a helpful research assistant. The user is working with a file named "${fileName}". Answer their questions about it.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      max_tokens: 512,
      temperature: 0.4,
    });

    const answer = completion.choices[0]?.message?.content?.trim() ?? 'No response generated.';
    return NextResponse.json({ answer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Notebook agent QA error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
