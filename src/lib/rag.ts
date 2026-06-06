import { supabaseAdmin } from './supabaseServer';

const CHUNK_SIZE = 800;        // characters per chunk
const CHUNK_OVERLAP = 100;     // characters of overlap between chunks

// ─────────────────────────────────────────────────────────────
// Embedding (Gemini)
// ─────────────────────────────────────────────────────────────

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY environment variable.');
  }
  return apiKey;
}

function padEmbedding(vector: number[], targetDim = 1536): number[] {
  if (vector.length >= targetDim) {
    return vector.slice(0, targetDim);
  }
  return [...vector, ...new Array(targetDim - vector.length).fill(0)];
}

/**
 * Embeds a single string using Google Gemini text-embedding-004.
 * Padded to 1536 dimensions to match the database pgvector schema.
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = getGeminiApiKey();
  const cleanedText = text.replace(/\n/g, ' ').trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: cleanedText }]
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini embedding API failed with status ${response.status}`);
  }

  const data = await response.json();
  const vector = data.embedding?.values;
  if (!vector || !Array.isArray(vector)) {
    throw new Error('Invalid response structure from Gemini embedding API');
  }

  return padEmbedding(vector);
}

/**
 * Embeds multiple strings in a single API call (batch) using Google Gemini.
 * Padded to 1536 dimensions.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = getGeminiApiKey();
  
  const requests = texts.map((text) => ({
    model: 'models/text-embedding-004',
    content: {
      parts: [{ text: text.replace(/\n/g, ' ').trim() }]
    }
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini batch embedding API failed with status ${response.status}`);
  }

  const data = await response.json();
  const embeddings = data.embeddings;
  if (!embeddings || !Array.isArray(embeddings)) {
    throw new Error('Invalid response structure from Gemini batch embedding API');
  }

  return embeddings.map((e: any) => padEmbedding(e.values));
}

// ─────────────────────────────────────────────────────────────
// Text Chunking
// ─────────────────────────────────────────────────────────────

/**
 * Splits a large text into overlapping chunks.
 */
export function chunkText(text: string, sourceName: string): Array<{ content: string; sourceName: string }> {
  const chunks: Array<{ content: string; sourceName: string }> = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) { // skip tiny chunks
      chunks.push({ content: chunk, sourceName });
    }
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

// ─────────────────────────────────────────────────────────────
// Vector Store (Supabase pgvector)
// ─────────────────────────────────────────────────────────────

interface ChunkToUpsert {
  content: string;
  sourceName: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Embeds an array of text chunks and upserts them into the
 * document_chunks table in Supabase.
 */
export async function upsertChunks(
  userId: string,
  chunks: ChunkToUpsert[]
): Promise<void> {
  if (chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = await embedBatch(texts);

  const rows = chunks.map((chunk, i) => ({
    user_id: userId,
    source_id: chunk.sourceId ?? null,
    source_name: chunk.sourceName,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    metadata: chunk.metadata ?? {},
  }));

  const { error } = await supabaseAdmin
    .from('document_chunks')
    .insert(rows);

  if (error) {
    throw new Error(`Failed to upsert chunks: ${error.message}`);
  }
}

/**
 * Deletes all document_chunks for a given source (used when re-uploading
 * or deleting a source file).
 */
export async function deleteChunksBySource(sourceId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('document_chunks')
    .delete()
    .eq('source_id', sourceId);

  if (error) throw new Error(`Failed to delete chunks: ${error.message}`);
}

/**
 * Deletes all "Student Data" chunks for a user (system-generated context).
 */
export async function deleteStudentDataChunks(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('document_chunks')
    .delete()
    .eq('user_id', userId)
    .is('source_id', null);

  if (error) throw new Error(`Failed to delete student data chunks: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────
// Retrieval
// ─────────────────────────────────────────────────────────────

interface RetrievedChunk {
  id: string;
  source_name: string;
  content: string;
  similarity: number;
}

/**
 * Retrieves the top-k most relevant document chunks for a query
 * using pgvector cosine similarity search.
 *
 * @param userId     - Filter results to this user's chunks only
 * @param query      - The user's question
 * @param topK       - Max number of chunks to retrieve
 * @param sourceIds  - Optional: restrict search to specific source files
 */
export async function retrieveContext(
  userId: string,
  query: string,
  topK = 8,
  sourceIds?: string[]
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query);

  const { data, error } = await supabaseAdmin.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: 0.65,
    match_count: topK,
    p_user_id: userId,
    p_source_ids: sourceIds ?? null,
  });

  if (error) {
    console.error('Vector search error:', error);
    return [];
  }

  return (data as RetrievedChunk[]) ?? [];
}

// ─────────────────────────────────────────────────────────────
// Student Context Syncing
// ─────────────────────────────────────────────────────────────

/**
 * Builds and upserts the student's live academic data (subjects, grades,
 * assignments, exams, goals) into the vector store so the AI has
 * personalized context even without uploaded files.
 */
export async function syncStudentDataToVectorStore(userId: string): Promise<{ chunksUpserted: number }> {
  // 1. Fetch student data from Supabase
  const [
    { data: subjects },
    { data: assignments },
    { data: exams },
    { data: grades },
    { data: goals },
    { data: semesters },
  ] = await Promise.all([
    supabaseAdmin.from('subjects').select('*').eq('user_id', userId),
    supabaseAdmin.from('assignments').select('*, subjects(name)').eq('user_id', userId),
    supabaseAdmin.from('exams').select('*, subjects(name)').eq('user_id', userId),
    supabaseAdmin.from('grades').select('*, subjects(name)').eq('user_id', userId),
    supabaseAdmin.from('goals').select('*').eq('user_id', userId),
    supabaseAdmin.from('semesters').select('*').eq('user_id', userId),
  ]);

  const textChunks: string[] = [];

  // Semesters
  if (semesters && semesters.length > 0) {
    const activeSem = semesters.find((s: any) => s.is_active) || semesters[0];
    textChunks.push(
      `Current Semester: ${activeSem.name} (${activeSem.academic_year}) at ${activeSem.school_name}. ` +
        `Grading System: ${activeSem.grading_system}.`
    );
  }

  // Subjects
  if (subjects && subjects.length > 0) {
    const subjText = subjects.map((s: any) =>
      `Subject: ${s.name} (${s.code}), taught by ${s.instructor_name}, scheduled ${s.schedule}, room ${s.room}.`
    ).join(' ');
    textChunks.push(`Student's enrolled subjects this semester: ${subjText}`);
  }

  // Assignments
  if (assignments && assignments.length > 0) {
    const pending = assignments.filter((a: any) => a.status !== 'submitted');
    if (pending.length > 0) {
      const assignText = pending.map((a: any) =>
        `Assignment "${a.title}" for ${(a as any).subjects?.name ?? 'unknown subject'}, ` +
        `due ${new Date(a.deadline).toLocaleDateString()}, priority: ${a.priority}, status: ${a.status}.`
      ).join(' ');
      textChunks.push(`Pending assignments: ${assignText}`);
    }
  }

  // Exams
  if (exams && exams.length > 0) {
    const upcoming = exams.filter((e: any) => new Date(e.exam_date) >= new Date());
    if (upcoming.length > 0) {
      const examText = upcoming.map((e: any) =>
        `Exam "${e.title}" for ${(e as any).subjects?.name ?? 'unknown subject'} ` +
        `on ${new Date(e.exam_date).toLocaleDateString()}. Topics: ${e.topics}.`
      ).join(' ');
      textChunks.push(`Upcoming exams: ${examText}`);
    }
  }

  // Grades — compute averages per subject
  if (grades && grades.length > 0) {
    const gradesBySubject: Record<string, { scores: number[]; subjName: string }> = {};
    for (const g of grades as any[]) {
      const key = g.subject_id;
      if (!gradesBySubject[key]) {
        gradesBySubject[key] = { scores: [], subjName: g.subjects?.name ?? 'Unknown Subject' };
      }
      gradesBySubject[key].scores.push((g.score / g.max_score) * 100);
    }

    const gradeText = Object.values(gradesBySubject).map(({ scores, subjName }) => {
      const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      return `${subjName}: ${avg}% average (${scores.length} entries)`;
    }).join(', ');

    textChunks.push(`Student's current grades: ${gradeText}`);
  }

  // Goals
  if (goals && goals.length > 0) {
    const goalText = goals.map((g: any) =>
      `Goal "${g.title}" — status: ${g.status}, target: ${g.target_date}.`
    ).join(' ');
    textChunks.push(`Student goals: ${goalText}`);
  }

  if (textChunks.length === 0) {
    return { chunksUpserted: 0 };
  }

  // 2. Delete old system-generated chunks for this user
  await deleteStudentDataChunks(userId);

  // 3. Upsert new chunks
  const chunksToUpsert = textChunks.map((content) => ({
    content,
    sourceName: 'Student Data',
    sourceId: undefined,
    metadata: { type: 'system', userId },
  }));

  await upsertChunks(userId, chunksToUpsert);

  return { chunksUpserted: chunksToUpsert.length };
}

// ─────────────────────────────────────────────────────────────
// RAG Response Generation (Gemini)
// ─────────────────────────────────────────────────────────────
 
interface GenerateOptions {
  userId: string;
  question: string;
  sourceIds?: string[];
}
 
interface RAGResult {
  text: string;
  sources: string[];
}
 
/**
 * Full RAG pipeline:
 * 1. Embed the question using Gemini
 * 2. Retrieve relevant context from pgvector
 * 3. Build an augmented prompt
 * 4. Generate a response with Google Gemini gemini-2.5-flash
 */
export async function generateRAGResponse(options: GenerateOptions): Promise<RAGResult> {
  const { userId, question, sourceIds } = options;
 
  // Step 1: Retrieve context
  const chunks = await retrieveContext(userId, question, 8, sourceIds);
 
  // Step 2: Build context block
  const uniqueSources = [...new Set(chunks.map((c) => c.source_name))];
  const contextBlock = chunks.length > 0
    ? chunks.map((c, i) => `[${i + 1}] (Source: ${c.source_name})\n${c.content}`).join('\n\n---\n\n')
    : '';
 
  // Step 3: System prompt
  const systemPrompt = `You are StudentFlow's AI Study Assistant — a smart, personalized academic helper.
 
${contextBlock
  ? `You have access to the following relevant context from the student's uploaded materials and academic data:
 
<context>
${contextBlock}
</context>
 
Use this context to give accurate, specific answers. Cite which source you used when relevant (e.g., "According to your notes on [topic]..."). If the context does not contain enough information, say so and provide your best general answer.`
  : `No specific materials are uploaded yet. Give a helpful general academic answer.`
}
 
Format your response clearly using Markdown:
- Use headers (##, ###) for sections
- Use bullet points for lists
- Use code blocks for code
- Use bold for key terms
- Be concise but thorough`;
 
  // Step 4: Generate using Gemini REST API
  const apiKey = getGeminiApiKey();
 
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: question }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500
        }
      })
    }
  );
 
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini generation API failed with status ${response.status}`);
  }
 
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.';
 
  return { text, sources: uniqueSources };
}
