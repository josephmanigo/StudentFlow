import { NextResponse } from 'next/server';
import { generateRAGResponse, syncStudentDataToVectorStore } from '@/lib/rag';

export const maxDuration = 60; // seconds (Vercel/Next.js route timeout)

export async function POST(request: Request) {
  try {
    const { prompt, userId, sourceIds } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Fallback simulator when OpenAI key is not set
    if (!process.env.OPENAI_API_KEY) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({
        text: `### 🤖 StudentFlow AI (Demo Mode)\n\n**Note:** Add your \`OPENAI_API_KEY\` to \`.env.local\` to enable the full RAG-powered AI with file upload support.\n\n**Your question:** "${prompt}"\n\nIn live mode, I would:\n1. Search your uploaded study notes and materials\n2. Retrieve the most relevant sections\n3. Generate a personalized answer based on your actual content\n\n**Study Tip:** Try uploading a PDF of your lecture notes or textbook chapter!`,
        sources: [],
      });
    }

    // Sync student data to vector store before answering (runs fast, updates context)
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await syncStudentDataToVectorStore(userId);
      } catch (syncErr) {
        // Non-fatal — continue with whatever context exists
        console.warn('Student data sync skipped:', syncErr);
      }
    }

    // Generate RAG response
    const result = await generateRAGResponse({
      userId: userId ?? 'anonymous',
      question: prompt,
      sourceIds: sourceIds ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
