import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  let taskName: string;
  let proposalTarget: string;
  let notebookContent: string;
  let researchContext: string;
  let researchSources: Array<{ url: string; title: string }>;

  try {
    const body = await req.json();
    taskName = body.taskName?.trim();
    proposalTarget = body.proposalTarget?.trim() ?? 'notebook';
    notebookContent = body.notebookContent?.trim() ?? '';
    researchContext = body.researchContext?.trim() ?? '';
    researchSources = Array.isArray(body.researchSources) ? body.researchSources : [];
    if (!taskName) {
      return NextResponse.json({ error: 'Missing taskName' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  const targetInstructions: Record<string, string> = {
    notebook: 'Generate a concise paragraph (1-3 sentences) of text content to add to the notebook editor. Output only the paragraph text, no labels.',
    'file-tree': 'Generate a short filename (e.g. "api-reference.md" or "payment.test.ts") that should be added to the project file tree for this task. Output only the filename, nothing else.',
    canvas: 'Generate a short label (1-6 words) for a new canvas sticky note or node that relates to this task. Output only the label text.',
  };

  const targetInstruction = targetInstructions[proposalTarget] ?? targetInstructions['notebook'];

  const contextSection = notebookContent
    ? `\n\nNotebook context (first 1500 chars):\n${notebookContent.slice(0, 1500)}`
    : '';

  const sourcesList = researchSources.length > 0
    ? researchSources.slice(0, 5).map(s => `- ${s.title || s.url}: ${s.url}`).join('\n')
    : '';

  const researchSection = (researchContext || sourcesList)
    ? `\n\nResearch context (from web search):\n${researchContext.slice(0, 800)}${sourcesList ? `\n\nCited sources:\n${sourcesList}` : ''}`
    : '';

  const systemPrompt = `You are a smart project assistant helping generate edit proposals for a task.
Task: "${taskName}"
Proposal target: ${proposalTarget}${contextSection}${researchSection}

${targetInstruction}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a proposal for the task: "${taskName}"` },
      ],
      max_tokens: 256,
      temperature: 0.6,
    });

    const proposal = completion.choices[0]?.message?.content?.trim() ?? 'No proposal generated.';
    return NextResponse.json({ proposal });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Notebook task propose error:', message);
    return NextResponse.json({ error: 'Failed to generate proposal' }, { status: 500 });
  }
}
