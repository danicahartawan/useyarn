import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });

    const text = result.value.slice(0, 1000).trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error('parse-docx error:', err);
    return NextResponse.json({ error: 'Failed to parse DOCX' }, { status: 500 });
  }
}
