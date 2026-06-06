export interface GradeBreakdownItem {
  category: string;  // e.g. "Written Work", "Performance Task"
  weight: number;    // 0-100 (percentage)
}

export interface Semester {
  id: string;
  user_id: string;
  school_name: string;
  name: string; // e.g. "1st Semester"
  academic_year: string; // e.g. "2025-2026"
  grading_system: 'GPA' | 'Percentage' | 'Letter';
  is_active: boolean;
  grade_breakdown?: GradeBreakdownItem[]; // custom category weights per semester
  created_at?: string;
}

export interface Subject {
  id: string;
  semester_id: string;
  user_id: string;
  name: string;
  code: string;
  instructor_name: string;
  schedule: string; // e.g., "Mon/Wed 10:00 AM - 11:30 AM" or JSON string
  room: string;
  color: string; // Hex color or Tailwind color class
  google_classroom_id?: string; // Links this subject to a Google Classroom Course
  created_at?: string;
}

export interface Assignment {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  description: string;
  deadline: string; // ISO string
  priority: 'low' | 'medium' | 'high';
  status: 'not started' | 'in progress' | 'submitted';
  reminder_date?: string; // ISO string
  google_classroom_id?: string; // Links this assignment to a Google Classroom Coursework item
  created_at?: string;
}

export interface Exam {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  exam_date: string; // ISO string
  topics: string; // comma-separated or text description
  reminder_date?: string; // ISO string
  google_classroom_id?: string; // Links this quiz/exam to a Google Classroom Coursework item
  created_at?: string;
}

export interface Grade {
  id: string;
  subject_id: string;
  user_id: string;
  category: 'quiz' | 'activity' | 'midterm exam' | 'final exam' | 'project' | 'attendance';
  name: string;
  score: number;
  max_score: number;
  weight: number; // e.g., 0.1 for 10%
  google_classroom_id?: string; // Links this grade to a Google Classroom Coursework item
  created_at?: string;
}

export interface Attendance {
  id: string;
  subject_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
  created_at?: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  completed_at: string; // ISO string
  type: 'study' | 'break';
}

export interface StudyChat {
  id: string;
  user_id: string;
  message: string;
  sender: 'user' | 'ai';
  created_at: string; // ISO string
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'completed';
  target_date: string; // YYYY-MM-DD
  created_at?: string;
}

export interface UserProfile {
  id: string;
  school_name?: string;
  grading_system?: string;
  created_at?: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  loading: boolean;
}

// ─── NotebookLM-style source tracking ───────────────────────

export interface NotebookSource {
  id: string;
  user_id: string;
  name: string;
  file_type: 'pdf' | 'txt' | 'docx' | 'md';
  size_bytes?: number;
  status: 'processing' | 'ready' | 'error';
  chunk_count: number;
  storage_path?: string;
  created_at: string;
}

// ─── RAG vector store chunk ──────────────────────────────────

export interface DocumentChunk {
  id: string;
  user_id: string;
  source_id?: string;
  source_name: string;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
