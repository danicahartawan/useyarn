import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface FileInput {
  name: string;
  content: string;
}

interface CategorizedFile {
  name: string;
  category: string;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const MAX_FILES_PER_REQUEST = 20;

const CATEGORY_LABELS = [
  'Technical Documentation',
  'Legal Contract',
  'Research Report',
  'Meeting Notes',
  'Financial Data',
  'Product Spec',
  'Marketing Copy',
  'Source Code',
  'Academic Paper',
  'User Manual',
  'General'
];

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function detectNamingConvention(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, '');

  if (/^\d{4}[-_]\d{2}[-_]\d{2}/.test(base)) return 'Date-Prefixed';
  if (/^\d{8}/.test(base)) return 'Date-Prefixed';
  if (/^[a-z]+(_[a-z0-9]+)+$/.test(base)) return 'Snake Case';
  if (/^[a-z][a-zA-Z0-9]+$/.test(base) && /[A-Z]/.test(base)) return 'Camel Case';
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(base)) return 'Kebab Case';
  if (/^[A-Z][a-z]+([A-Z][a-z]+)+$/.test(base)) return 'Pascal Case';
  if (/^[A-Z_]+$/.test(base)) return 'Screaming Snake Case';

  return null;
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

async function getEmbeddingCategories(
  openai: OpenAI,
  filesWithContent: FileInput[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (filesWithContent.length === 0) return map;

  const textsToEmbed = [
    ...filesWithContent.map(f => f.content.slice(0, 800).trim()),
    ...CATEGORY_LABELS
  ];

  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: textsToEmbed,
    encoding_format: 'float'
  });

  const allEmbeddings = embeddingResponse.data.map(d => d.embedding);
  const fileEmbeddings = allEmbeddings.slice(0, filesWithContent.length);
  const labelEmbeddings = allEmbeddings.slice(filesWithContent.length);

  filesWithContent.forEach((file, idx) => {
    let bestLabel = 'General';
    let bestScore = -Infinity;
    labelEmbeddings.forEach((labelEmb, labelIdx) => {
      const score = cosineSimilarity(fileEmbeddings[idx], labelEmb);
      if (score > bestScore) {
        bestScore = score;
        bestLabel = CATEGORY_LABELS[labelIdx];
      }
    });
    map.set(file.name, bestLabel);
  });

  return map;
}

async function getChatCategory(openai: OpenAI, file: FileInput): Promise<string> {
  const snippet = file.content.slice(0, 800).trim();
  if (!snippet) return 'General';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a document classifier. Given a filename and a short text snippet from the file, return a single short category label (2-4 words max) that best describes the content type. Examples: "Technical Documentation", "Legal Contract", "Research Report", "Meeting Notes", "Financial Data", "Product Spec", "Marketing Copy", "Source Code". Return ONLY the category label, nothing else.'
      },
      {
        role: 'user',
        content: `Filename: ${file.name}\n\nContent snippet:\n${snippet}`
      }
    ],
    max_tokens: 20,
    temperature: 0.2
  });

  return response.choices[0]?.message?.content?.trim() ?? 'General';
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute before uploading more files.' },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  let files: FileInput[];
  try {
    const body = await req.json();
    files = body.files;
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files per request.` },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });
  const filesWithContent = files.filter(f => f.content.trim().length > 0);

  // Run embeddings classification and chat classification in parallel for all files with content
  let embeddingCategoryMap: Map<string, string> = new Map();
  const chatCategoryMap: Map<string, string> = new Map();

  await Promise.all([
    (async () => {
      try {
        embeddingCategoryMap = await getEmbeddingCategories(openai, filesWithContent);
      } catch {
        // embedding failed, fall back to chat only
      }
    })(),
    ...filesWithContent.map(async (file) => {
      try {
        chatCategoryMap.set(file.name, await getChatCategory(openai, file));
      } catch {
        chatCategoryMap.set(file.name, 'General');
      }
    })
  ]);

  const results: CategorizedFile[] = files.map((file) => {
    const namingConvention = detectNamingConvention(file.name);
    const hasContent = file.content.trim().length > 0;

    let contentCategory: string;
    if (!hasContent) {
      contentCategory = 'General';
    } else {
      const embeddingCategory = embeddingCategoryMap.get(file.name);
      const chatCategory = chatCategoryMap.get(file.name) ?? 'General';

      if (embeddingCategory && embeddingCategory !== 'General') {
        contentCategory = embeddingCategory === chatCategory
          ? embeddingCategory
          : chatCategory;
      } else {
        contentCategory = chatCategory;
      }
    }

    let category: string;
    if (namingConvention) {
      category = `${namingConvention} — ${contentCategory}`;
    } else {
      category = contentCategory;
    }

    return { name: file.name, category };
  });

  return NextResponse.json({ files: results });
}
