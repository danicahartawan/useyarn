import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamically import pdf-parse to avoid build-time issues
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);

    // Extract a usable title: first non-empty line of text
    const lines = result.text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const rawTitle = lines[0] ?? file.name.replace(/\.pdf$/i, '');
    const title = rawTitle.length > 60 ? rawTitle.slice(0, 57) + '…' : rawTitle;

    // Extract a short description from the next few lines
    const descLines = lines.slice(1, 4).join(' ');
    const description = descLines.length > 120 ? descLines.slice(0, 117) + '…' : descLines;

    return NextResponse.json({
      title,
      subtitle: 'PDF',
      description,
      filename: file.name,
      pages: result.numpages
    });
  } catch (err) {
    console.error('parse-pdf error:', err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
