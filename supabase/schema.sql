-- ============================================================
-- StudentFlow — Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name TEXT,
  grading_system TEXT DEFAULT 'GPA',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: semesters
-- ============================================================
CREATE TABLE IF NOT EXISTS public.semesters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name     TEXT NOT NULL DEFAULT '',
  name            TEXT NOT NULL,
  academic_year   TEXT NOT NULL,
  grading_system  TEXT NOT NULL DEFAULT 'GPA',
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  grade_breakdown JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own semesters"
  ON public.semesters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: subjects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id     UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL DEFAULT '',
  instructor_name TEXT NOT NULL DEFAULT '',
  schedule        TEXT NOT NULL DEFAULT '',
  room            TEXT NOT NULL DEFAULT '',
  color           TEXT NOT NULL DEFAULT '#4F46E5',
  google_classroom_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subjects"
  ON public.subjects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  deadline      TIMESTAMPTZ NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status        TEXT NOT NULL DEFAULT 'not started' CHECK (status IN ('not started', 'in progress', 'submitted')),
  reminder_date TIMESTAMPTZ,
  google_classroom_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assignments"
  ON public.assignments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: exams
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  exam_date     TIMESTAMPTZ NOT NULL,
  topics        TEXT NOT NULL DEFAULT '',
  reminder_date TIMESTAMPTZ,
  google_classroom_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exams"
  ON public.exams FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: grades
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   TEXT NOT NULL CHECK (category IN ('quiz', 'activity', 'midterm exam', 'final exam', 'project', 'attendance')),
  name       TEXT NOT NULL,
  score      NUMERIC NOT NULL,
  max_score  NUMERIC NOT NULL DEFAULT 100,
  weight     NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own grades"
  ON public.grades FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own attendance"
  ON public.attendance FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: pomodoro_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  type             TEXT NOT NULL DEFAULT 'study' CHECK (type IN ('study', 'break')),
  completed_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pomodoro sessions"
  ON public.pomodoro_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: study_chats
-- ============================================================
CREATE TABLE IF NOT EXISTS public.study_chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  sender     TEXT NOT NULL DEFAULT 'user' CHECK (sender IN ('user', 'ai')),
  sources    JSONB,   -- array of source names referenced in this message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.study_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study chats"
  ON public.study_chats FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: goals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  target_date DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: notebook_sources  (NotebookLM-style uploaded files)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notebook_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,          -- original filename
  file_type     TEXT NOT NULL DEFAULT 'pdf',  -- 'pdf', 'txt', 'docx'
  size_bytes    BIGINT,
  status        TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  chunk_count   INTEGER DEFAULT 0,
  storage_path  TEXT,                   -- Supabase Storage path (optional)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notebook_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notebook sources"
  ON public.notebook_sources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: document_chunks  (RAG vector store)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id  UUID REFERENCES public.notebook_sources(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL DEFAULT 'Student Data',
  content    TEXT NOT NULL,
  embedding  vector(1536),   -- OpenAI text-embedding-3-small dimension
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own document chunks"
  ON public.document_chunks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- FUNCTION: match_documents  (vector similarity search RPC)
-- ============================================================
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding  vector(1536),
  match_threshold  float    DEFAULT 0.70,
  match_count      int      DEFAULT 8,
  p_user_id        uuid     DEFAULT NULL,
  p_source_ids     uuid[]   DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  source_name text,
  content     text,
  similarity  float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.source_name,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE
    (p_user_id IS NULL OR dc.user_id = p_user_id)
    AND (p_source_ids IS NULL OR dc.source_id = ANY(p_source_ids))
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Trigger: auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, school_name, grading_system)
  VALUES (NEW.id, '', 'GPA')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
