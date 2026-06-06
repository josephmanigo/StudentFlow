import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { chunkText, upsertChunks, deleteChunksBySource } from '@/lib/rag';

export const maxDuration = 120; // 2 minutes timeout

function parseGoogleDueDate(dueDate?: { year?: number; month?: number; day?: number }, dueTime?: { hours?: number; minutes?: number }) {
  if (!dueDate || !dueDate.year || !dueDate.month || !dueDate.day) {
    return null;
  }
  const year = dueDate.year;
  const month = String(dueDate.month).padStart(2, '0');
  const day = String(dueDate.day).padStart(2, '0');
  const hours = dueTime && dueTime.hours !== undefined ? String(dueTime.hours).padStart(2, '0') : '23';
  const minutes = dueTime && dueTime.minutes !== undefined ? String(dueTime.minutes).padStart(2, '0') : '59';
  return `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`;
}

export async function POST(request: Request) {
  try {
    const { userId, semesterId, isLocalMode, courses = [], coursework = [], materials = [] } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    let importedSubjects = 0;
    let importedAssignments = 0;
    let importedExams = 0;

    // A map from classroom courseId to Supabase subject UUID
    const courseIdToSubjectIdMap: Record<string, string> = {};
    const courseIdToNameMap: Record<string, string> = {};

    courses.forEach((c: any) => {
      courseIdToNameMap[c.id] = c.name;
    });

    if (!isLocalMode) {
      if (!semesterId) {
        return NextResponse.json({ error: 'semesterId is required in non-local mode' }, { status: 400 });
      }

      const COLORS = ['#4F46E5', '#0EA5E9', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

      // 1. Fetch existing subjects for the user
      const { data: existingSubjects, error: subjectsError } = await supabaseAdmin
        .from('subjects')
        .select('id, name, google_classroom_id')
        .eq('user_id', userId);

      if (subjectsError) {
        throw new Error(`Failed to fetch existing subjects: ${subjectsError.message}`);
      }

      // Build initial mapping
      existingSubjects?.forEach((s: any) => {
        if (s.google_classroom_id) {
          courseIdToSubjectIdMap[s.google_classroom_id] = s.id;
        }
      });

      // 2. Insert subjects if they don't exist
      for (let idx = 0; idx < courses.length; idx++) {
        const course = courses[idx];
        let subjectId = courseIdToSubjectIdMap[course.id];

        if (!subjectId) {
          // Check if subject with same name or classroom id exists
          const existing = existingSubjects?.find(
            (s: any) => s.name.toLowerCase() === course.name.toLowerCase() || s.google_classroom_id === course.id
          );

          if (existing) {
            subjectId = existing.id;
            // Update classroom ID if missing
            if (!existing.google_classroom_id) {
              await supabaseAdmin
                .from('subjects')
                .update({ google_classroom_id: course.id })
                .eq('id', existing.id);
            }
          } else {
            const { data: newSubj, error: insertSubjError } = await supabaseAdmin
              .from('subjects')
              .insert({
                semester_id: semesterId,
                user_id: userId,
                name: course.name,
                code: course.section || '',
                instructor_name: 'Google Classroom',
                schedule: course.descriptionHeading || 'Imported from Google Classroom',
                room: course.room || '',
                color: COLORS[idx % COLORS.length],
                google_classroom_id: course.id,
              })
              .select()
              .single();

            if (insertSubjError) {
              throw new Error(`Failed to insert subject: ${insertSubjError.message}`);
            }

            subjectId = newSubj.id;
            importedSubjects++;
          }
          courseIdToSubjectIdMap[course.id] = subjectId;
        }
      }

      // 3. Fetch existing assignments to prevent duplicates
      const { data: existingAssignments, error: assignmentsErr } = await supabaseAdmin
        .from('assignments')
        .select('id, title, google_classroom_id, subject_id, status')
        .eq('user_id', userId);

      if (assignmentsErr) {
        throw new Error(`Failed to fetch coursework items: ${assignmentsErr.message}`);
      }

      // 4. Insert or update coursework as assignments
      const assignmentsToInsert: any[] = [];

      for (const item of coursework) {
        const subjectId = courseIdToSubjectIdMap[item.courseId];
        if (!subjectId) continue;

        const deadlineVal = parseGoogleDueDate(item.dueDate, item.dueTime) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const isDone = item.submissionState === 'TURNED_IN' || item.submissionState === 'RETURNED';
        const itemStatus = isDone ? 'submitted' : 'not started';

        const existing = existingAssignments?.find(
          (a: any) => a.google_classroom_id === item.id || (a.subject_id === subjectId && a.title.toLowerCase() === item.title.toLowerCase())
        );

        if (existing) {
          // Sync submission status: if done in Classroom, update in Supabase
          if (isDone && existing.status !== 'submitted') {
            await supabaseAdmin
              .from('assignments')
              .update({ status: 'submitted' })
              .eq('id', existing.id);
          }
          // Link Google Classroom ID if missing
          if (!existing.google_classroom_id) {
            await supabaseAdmin
              .from('assignments')
              .update({ google_classroom_id: item.id })
              .eq('id', existing.id);
          }
        } else {
          assignmentsToInsert.push({
            subject_id: subjectId,
            user_id: userId,
            title: item.title,
            description: item.description || '',
            deadline: deadlineVal,
            priority: 'medium',
            status: itemStatus,
            google_classroom_id: item.id,
          });
          importedAssignments++;
        }
      }

      if (assignmentsToInsert.length > 0) {
        const { error: batchAssignErr } = await supabaseAdmin.from('assignments').insert(assignmentsToInsert);
        if (batchAssignErr) throw new Error(`Batch assignment insert failed: ${batchAssignErr.message}`);
      }

      // 4b. Fetch existing grades to prevent duplicates
      const { data: existingGrades, error: gradesErr } = await supabaseAdmin
        .from('grades')
        .select('id, name, google_classroom_id, subject_id, score')
        .eq('user_id', userId);

      if (gradesErr) {
        throw new Error(`Failed to fetch grades: ${gradesErr.message}`);
      }

      // 4c. Insert or update coursework grades
      const gradesToInsert: any[] = [];

      for (const item of coursework) {
        const subjectId = courseIdToSubjectIdMap[item.courseId];
        if (!subjectId) continue;

        const gradeValue = item.assignedGrade !== undefined && item.assignedGrade !== null 
          ? item.assignedGrade 
          : (item.draftGrade !== undefined && item.draftGrade !== null ? item.draftGrade : null);

        if (gradeValue !== null) {
          const maxPoints = item.maxPoints || 100;
          const isQuiz = /quiz|test/i.test(item.title) || item.workType === 'MULTIPLE_CHOICE_QUESTION';
          const gradeCategory = isQuiz ? 'quiz' : 'activity';

          const existing = existingGrades?.find(
            (g: any) => g.google_classroom_id === item.id || (g.subject_id === subjectId && g.name === `Grade for ${item.title}`)
          );

          if (existing) {
            // Update score if it changed
            if (Number(existing.score) !== Number(gradeValue)) {
              await supabaseAdmin
                .from('grades')
                .update({ score: gradeValue, max_score: maxPoints })
                .eq('id', existing.id);
            }
            if (!existing.google_classroom_id) {
              await supabaseAdmin
                .from('grades')
                .update({ google_classroom_id: item.id })
                .eq('id', existing.id);
            }
          } else {
            gradesToInsert.push({
              subject_id: subjectId,
              user_id: userId,
              category: gradeCategory,
              name: `Grade for ${item.title}`,
              score: gradeValue,
              max_score: maxPoints,
              weight: 0,
              google_classroom_id: item.id,
            });
          }
        }
      }

      if (gradesToInsert.length > 0) {
        const { error: batchGradesErr } = await supabaseAdmin.from('grades').insert(gradesToInsert);
        if (batchGradesErr) throw new Error(`Batch grades insert failed: ${batchGradesErr.message}`);
      }
    }

    // 5. Index Coursework Materials / Notes (Same flow for Local and Supabase modes)
    if (materials.length > 0 && process.env.OPENAI_API_KEY) {
      // Group materials by course
      const materialsByCourse: Record<string, any[]> = {};
      materials.forEach((m: any) => {
        if (!materialsByCourse[m.courseId]) {
          materialsByCourse[m.courseId] = [];
        }
        materialsByCourse[m.courseId].push(m);
      });

      for (const [courseId, courseMaterials] of Object.entries(materialsByCourse)) {
        const courseName = courseIdToNameMap[courseId] || 'Course';
        const sourceName = `Google Classroom: ${courseName} Materials`;

        const combinedText = courseMaterials
          .map((m) => `Material Title: ${m.title}\nDescription: ${m.description || ''}\nURL: ${m.alternateLink || ''}`)
          .join('\n\n---\n\n');

        if (combinedText.trim().length < 10) continue;

        // Fetch or create notebook source
        let sourceId: string;
        const { data: existingSource } = await supabaseAdmin
          .from('notebook_sources')
          .select('id')
          .eq('user_id', userId)
          .eq('name', sourceName)
          .single();

        if (existingSource) {
          sourceId = existingSource.id;
          await supabaseAdmin
            .from('notebook_sources')
            .update({ status: 'processing', size_bytes: Buffer.byteLength(combinedText, 'utf-8') })
            .eq('id', sourceId);
        } else {
          const { data: newSource, error: createSourceErr } = await supabaseAdmin
            .from('notebook_sources')
            .insert({
              user_id: userId,
              name: sourceName,
              file_type: 'txt',
              size_bytes: Buffer.byteLength(combinedText, 'utf-8'),
              status: 'processing',
              chunk_count: 0,
            })
            .select()
            .single();

          if (createSourceErr || !newSource) {
            console.error('Failed to create notebook source:', createSourceErr);
            continue;
          }
          sourceId = newSource.id;
        }

        try {
          // Delete existing chunks if any (update case)
          await deleteChunksBySource(sourceId);

          // Chunk the text
          const chunks = chunkText(combinedText, sourceName);

          // Embed and insert
          await upsertChunks(
            userId,
            chunks.map((c) => ({
              content: c.content,
              sourceName: c.sourceName,
              sourceId,
              metadata: { courseId, classroomImport: true },
            }))
          );

          // Update source status
          await supabaseAdmin
            .from('notebook_sources')
            .update({ status: 'ready', chunk_count: chunks.length })
            .eq('id', sourceId);
        } catch (err) {
          console.error(`Error processing materials for ${courseName}:`, err);
          await supabaseAdmin
            .from('notebook_sources')
            .update({ status: 'error' })
            .eq('id', sourceId);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      importedSubjects,
      importedAssignments,
      importedExams,
    });
  } catch (error: any) {
    console.error('Classroom sync route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
