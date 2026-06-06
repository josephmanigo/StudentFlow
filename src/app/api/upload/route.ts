import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { chunkText, upsertChunks, deleteChunksBySource } from '@/lib/rag';

export const maxDuration = 120; // Allow up to 2 minutes for large files

// Max file size: 20 MB
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

// Supported MIME types
const SUPPORTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

/**
 * Extracts plain text from an uploaded file buffer.
 */
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    // pdf-parse may export as default or as the module itself depending on build
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Extract text from docx by parsing the XML inside the zip
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default ?? JSZipModule;
    const zip = await (JSZip as any).loadAsync(buffer);
    const xmlFile = (zip as any).file('word/document.xml');
    if (!xmlFile) return '';
    const xmlText = await xmlFile.async('text');
    // Strip all XML tags and extract text content
    const text = xmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  }

  return '';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validate file type
    const fileType = SUPPORTED_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported: PDF, TXT, MD, DOCX` },
        { status: 415 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20 MB.' },
        { status: 413 }
      );
    }

    // Check if Gemini is configured
    const hasGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!hasGeminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 503 }
      );
    }

    // 1. Create a "processing" record in notebook_sources
    const { data: sourceRecord, error: insertError } = await supabaseAdmin
      .from('notebook_sources')
      .insert({
        user_id: userId,
        name: file.name,
        file_type: fileType,
        size_bytes: file.size,
        status: 'processing',
        chunk_count: 0,
      })
      .select()
      .single();

    if (insertError || !sourceRecord) {
      throw new Error(`Failed to create source record: ${insertError?.message}`);
    }

    const sourceId = sourceRecord.id;

    try {
      // 2. Extract text from file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const rawText = await extractText(buffer, file.type);

      if (!rawText || rawText.trim().length < 10) {
        await supabaseAdmin
          .from('notebook_sources')
          .update({ status: 'error' })
          .eq('id', sourceId);

        return NextResponse.json(
          { error: 'Could not extract readable text from this file.' },
          { status: 422 }
        );
      }

      // 3. Chunk the text
      const chunks = chunkText(rawText, file.name);

      // 4. Delete any existing chunks for this source (re-upload case)
      await deleteChunksBySource(sourceId);

      // 5. Embed & upsert chunks into pgvector
      await upsertChunks(
        userId,
        chunks.map((c) => ({
          content: c.content,
          sourceName: c.sourceName,
          sourceId,
          metadata: { fileName: file.name, fileType },
        }))
      );

      // 6. Mark source as ready
      await supabaseAdmin
        .from('notebook_sources')
        .update({ status: 'ready', chunk_count: chunks.length })
        .eq('id', sourceId);

      return NextResponse.json({
        ok: true,
        source: {
          id: sourceId,
          name: file.name,
          file_type: fileType,
          size_bytes: file.size,
          status: 'ready',
          chunk_count: chunks.length,
          created_at: sourceRecord.created_at,
        },
      });
    } catch (processingError: any) {
      // Mark source as error
      await supabaseAdmin
        .from('notebook_sources')
        .update({ status: 'error' })
        .eq('id', sourceId);

      throw processingError;
    }
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}
