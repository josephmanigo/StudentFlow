import { NextResponse } from 'next/server';
import { generateRAGResponse, syncStudentDataToVectorStore } from '@/lib/rag';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const maxDuration = 60; // seconds (Vercel/Next.js route timeout)

async function generateLocalDatabaseResponse(userId: string | null, prompt: string): Promise<{ text: string; sources: string[] }> {
  const query = prompt.toLowerCase();
  
  if (!userId || userId === 'anonymous') {
    return {
      text: `### StudentFlow AI (Local Demo Mode)

**System Status: Local Database Mode**
Your Gemini API Key is currently unavailable or has exceeded its quota (429 Quota Exceeded). Since you are not logged in, I am showing a generic overview.

**Study Tip:** Try logging in and adding your subjects to get a personalized database-backed answer!`,
      sources: []
    };
  }

  try {
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

    let text = `**System Status: Local Database Mode**
Your Gemini API Key has exceeded its quota or is invalid. I am answering using your local StudentFlow tracker data.

`;

    // 1. SUBJECTS
    if (query.includes('subject') || query.includes('class') || query.includes('course') || query.includes('instructor') || query.includes('teacher')) {
      text += `### Your Enrolled Subjects\n\n`;
      if (subjects && subjects.length > 0) {
        subjects.forEach((s: any) => {
          text += `- **${s.name}** (${s.code || 'No code'})\n`;
          text += `  - Instructor: ${s.instructor_name || 'Not specified'}\n`;
          text += `  - Schedule: ${s.schedule || 'Not scheduled'}\n`;
          text += `  - Room: ${s.room || 'Online/TBA'}\n\n`;
        });
      } else {
        text += `You haven't added any subjects for this semester yet.\n`;
      }
      return { text, sources: ['Local Database: subjects'] };
    }

    // 2. GRADES
    if (query.includes('grade') || query.includes('score') || query.includes('gpa') || query.includes('performance') || query.includes('average')) {
      text += `### Academic Grades Summary\n\n`;
      if (grades && grades.length > 0) {
        const gradesBySubject: Record<string, { scores: number[]; subjName: string }> = {};
        for (const g of grades as any[]) {
          const key = g.subject_id;
          if (!gradesBySubject[key]) {
            gradesBySubject[key] = { scores: [], subjName: g.subjects?.name ?? 'Unknown Subject' };
          }
          const scoreNum = Number(g.score);
          const maxScoreNum = Number(g.max_score || 100);
          gradesBySubject[key].scores.push((scoreNum / maxScoreNum) * 100);
        }

        text += `Here are your calculated averages per subject:\n\n`;
        Object.values(gradesBySubject).forEach(({ scores, subjName }) => {
          const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
          text += `- **${subjName}**: **${avg}%** average based on ${scores.length} graded item(s)\n`;
        });

        text += `\n**Recent Grades Recorded:**\n`;
        grades.slice(0, 5).forEach((g: any) => {
          text += `- ${g.name} (${g.category}): **${g.score}/${g.max_score}** in ${(g as any).subjects?.name}\n`;
        });
      } else {
        text += `No grade entries have been recorded yet.\n`;
      }
      return { text, sources: ['Local Database: grades'] };
    }

    // 3. ASSIGNMENTS / DEADLINES
    if (query.includes('assignment') || query.includes('deadline') || query.includes('todo') || query.includes('task') || query.includes('due') || query.includes('date')) {
      text += `### Assignments and Deadlines\n\n`;
      const pending = (assignments || []).filter((a: any) => a.status !== 'submitted');
      const completed = (assignments || []).filter((a: any) => a.status === 'submitted');

      if (pending.length > 0) {
        text += `**Pending Assignments:**\n`;
        pending.forEach((a: any) => {
          const dateStr = new Date(a.deadline).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          text += `- **${a.title}** (due **${dateStr}**)\n`;
          text += `  - Subject: ${(a as any).subjects?.name ?? 'Unknown'}\n`;
          text += `  - Priority: ${a.priority}\n`;
          if (a.description) text += `  - Description: ${a.description}\n`;
          text += `\n`;
        });
      } else {
        text += `You have no pending assignments! Great job!\n\n`;
      }

      if (completed.length > 0) {
        text += `**Recently Submitted:**\n`;
        completed.slice(0, 5).forEach((a: any) => {
          text += `- ${a.title} (${(a as any).subjects?.name ?? 'Unknown'})\n`;
        });
      }
      return { text, sources: ['Local Database: assignments'] };
    }

    // 4. EXAMS
    if (query.includes('exam') || query.includes('test') || query.includes('quiz') || query.includes('midterm') || query.includes('final')) {
      text += `### Upcoming Exams\n\n`;
      if (exams && exams.length > 0) {
        const upcoming = exams.filter((e: any) => new Date(e.exam_date) >= new Date());
        if (upcoming.length > 0) {
          upcoming.forEach((e: any) => {
            const dateStr = new Date(e.exam_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
            text += `- **${e.title}** on **${dateStr}**\n`;
            text += `  - Subject: ${(e as any).subjects?.name ?? 'Unknown'}\n`;
            if (e.topics) text += `  - Topics: ${e.topics}\n`;
            text += `\n`;
          });
        } else {
          text += `You have no upcoming exams scheduled.\n`;
        }
      } else {
        text += `No exams are scheduled.\n`;
      }
      return { text, sources: ['Local Database: exams'] };
    }

    // 5. GOALS
    if (query.includes('goal') || query.includes('target') || query.includes('plan')) {
      text += `### Academic Goals\n\n`;
      if (goals && goals.length > 0) {
        goals.forEach((g: any) => {
          const dateStr = new Date(g.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          text += `- **${g.title}** (${g.status})\n`;
          text += `  - Target Date: ${dateStr}\n\n`;
        });
      } else {
        text += `You haven't set any academic goals yet. Go to the planner page to add some!\n`;
      }
      return { text, sources: ['Local Database: goals'] };
    }

    // 6. QUIZ Generator
    if (query.includes('quiz') || query.includes('test me') || query.includes('question')) {
      text += `### Practice Quiz (Local Database Mode)\n\n`;
      text += `Here are practice questions based on your current subjects and assignments to test your readiness:\n\n`;
      
      if (subjects && subjects.length > 0) {
        subjects.slice(0, 3).forEach((s: any, index: number) => {
          text += `${index + 1}. What are the primary learning objectives of your **${s.name}** course?\n`;
          text += `   - A) Reviewing syllabus and assignments\n`;
          text += `   - B) Standard subject-specific competence\n`;
          text += `   - C) Merely passing exam metrics\n`;
          text += `   - D) General knowledge only\n\n`;
        });
        
        const pending = (assignments || []).filter((a: any) => a.status !== 'submitted');
        if (pending.length > 0) {
          text += `4. Which of the following is the priority for your assignment **"${pending[0].title}"**?\n`;
          text += `   - A) High\n`;
          text += `   - B) Medium\n`;
          text += `   - C) Low\n`;
          text += `   - D) None\n\n`;
        } else {
          text += `4. How often should you check your StudentFlow planner for new deadlines?\n`;
          text += `   - A) Daily\n`;
          text += `   - B) Weekly\n`;
          text += `   - C) Only when an exam is tomorrow\n`;
          text += `   - D) Never\n\n`;
        }
        
        text += `5. If your current semester grading system is **${semesters?.[0]?.grading_system || 'GPA'}**, what is the target score needed to maintain your goal?\n`;
        text += `   - A) Maximum possible points\n`;
        text += `   - B) Passing mark\n`;
        text += `   - C) Half of the score\n`;
        text += `   - D) Depends on course weight\n\n`;
        
        text += `*Note: Answers are B, A (or the correct priority), A, D.*`;
      } else {
        text += `Please add subjects first so I can generate practice questions about them!`;
      }
      return { text, sources: ['Local Database: quiz generator'] };
    }

    // 7. SUMMARY / GENERAL
    text += `### General Overview\n\n`;
    const pendingCount = (assignments || []).filter((a: any) => a.status !== 'submitted').length;
    const activeSemester = semesters?.find((s: any) => s.is_active)?.name || 'Active Semester';
    
    text += `Welcome back! Here is a summary of your StudentFlow dashboard:\n\n`;
    text += `- Semester: ${activeSemester}\n`;
    text += `- Subjects: Enrolled in ${subjects?.length || 0} subject(s)\n`;
    text += `- Assignments: ${pendingCount} pending task(s)\n`;
    text += `- Upcoming Exams: ${exams?.length || 0} scheduled exam(s)\n`;
    text += `- Academic Goals: ${goals?.length || 0} goal(s) tracked\n\n`;
    
    text += `How else can I help you today? You can ask me about:\n`;
    text += `- "What are my subjects?"\n`;
    text += `- "How are my grades?"\n`;
    text += `- "What assignments do I have?"\n`;
    text += `- "Quiz me on this topic"\n`;
    
    return {
      text,
      sources: ['Local Database: general stats']
    };

  } catch (error) {
    console.error('Error generating local database response:', error);
    return {
      text: `### StudentFlow AI (Fallback)

**System Status: Local Database Mode**
Your Gemini API Key is currently unavailable or has exceeded its quota (429 Quota Exceeded). Additionally, fetching local data failed.

Please check your internet connection or verify your Supabase database is online.`,
      sources: []
    };
  }
}

export async function POST(request: Request) {
  let prompt: string | null = null;
  let userId: string | null = null;
  let sourceIds: string[] | undefined = undefined;

  try {
    const body = await request.json();
    prompt = body.prompt;
    userId = body.userId;
    sourceIds = body.sourceIds;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Fallback when Gemini key is not set or has placeholder value
    const hasGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!hasGeminiKey || hasGeminiKey.startsWith('your-')) {
      const fallbackResult = await generateLocalDatabaseResponse(userId, prompt);
      return NextResponse.json(fallbackResult);
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
    
    // Check if error is related to OpenAI quota/key or database match documents RPC failure
    // and fall back to local database response engine
    const isQuotaError = error.status === 429 || 
                         (error.message && (
                           error.message.includes('quota') || 
                           error.message.includes('429') ||
                           error.message.includes('API key') ||
                           error.message.includes('insufficient_quota')
                         ));
                         
    if (isQuotaError || error.message?.includes('match_documents') || error.message?.includes('embedding')) {
      try {
        const fallbackResult = await generateLocalDatabaseResponse(userId, prompt ?? '');
        return NextResponse.json(fallbackResult);
      } catch (fallbackErr) {
        console.error('Chat API fallback error:', fallbackErr);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
