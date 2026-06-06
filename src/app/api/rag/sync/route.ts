import { NextResponse } from 'next/server';
import { syncStudentDataToVectorStore } from '@/lib/rag';

/**
 * POST /api/rag/sync
 * Body: { userId: string }
 *
 * Syncs the student's live academic data (subjects, assignments,
 * grades, exams, goals) into the pgvector store so the AI has
 * personalized context for answering questions.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server not configured (missing OPENAI_API_KEY or SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 503 }
      );
    }

    const result = await syncStudentDataToVectorStore(userId);

    return NextResponse.json({ ok: true, chunksUpserted: result.chunksUpserted });
  } catch (error: any) {
    console.error('RAG sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
