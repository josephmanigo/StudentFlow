'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  Semester,
  Subject,
  Assignment,
  Exam,
  Grade,
  Attendance,
  PomodoroSession,
  StudyChat,
  Goal,
  UserSession,
  GradeBreakdownItem,
} from '@/types';

interface DataContextType {
  // Auth state & actions
  session: UserSession;
  isLocalMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;

  // App data state
  semesters: Semester[];
  subjects: Subject[];
  assignments: Assignment[];
  exams: Exam[];
  grades: Grade[];
  attendance: Attendance[];
  pomodoroSessions: PomodoroSession[];
  studyChats: StudyChat[];
  goals: Goal[];

  // Active items
  activeSemester: Semester | null;

  // Actions
  addSemester: (schoolName: string, name: string, academicYear: string, gradingSystem: 'GPA' | 'Percentage' | 'Letter', gradeBreakdown?: GradeBreakdownItem[]) => Promise<Semester>;
  setActiveSemester: (id: string) => Promise<void>;
  
  addSubject: (subject: Omit<Subject, 'id' | 'user_id' | 'semester_id'>) => Promise<Subject>;
  editSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addAssignment: (assignment: Omit<Assignment, 'id' | 'user_id'>) => Promise<Assignment>;
  editAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  addExam: (exam: Omit<Exam, 'id' | 'user_id'>) => Promise<Exam>;
  editExam: (id: string, updates: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;

  addGrade: (grade: Omit<Grade, 'id' | 'user_id'>) => Promise<Grade>;
  editGrade: (id: string, updates: Partial<Grade>) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;

  addAttendance: (attendance: Omit<Attendance, 'id' | 'user_id'>) => Promise<Attendance>;
  editAttendance: (id: string, updates: Partial<Attendance>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;

  addPomodoroSession: (duration: number, type: 'study' | 'break') => Promise<PomodoroSession>;
  
  addChatMessage: (message: string, sender: 'user' | 'ai') => Promise<StudyChat>;
  clearChatHistory: () => void;

  addGoal: (title: string, targetDate: string) => Promise<Goal>;
  toggleGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<UserSession>({ user: null, loading: true });
  const [isLocalMode, setIsLocalMode] = useState(true);

  // App data state
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [studyChats, setStudyChats] = useState<StudyChat[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeSemester, setActiveSemesterState] = useState<Semester | null>(null);

  // Initialize Auth Mode and Session
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsLocalMode(!configured);

    if (configured && supabase) {
      // Supabase Authentication listener
      supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
        if (sbSession) {
          setSession({
            user: {
              id: sbSession.user.id,
              email: sbSession.user.email || '',
              user_metadata: sbSession.user.user_metadata,
            },
            loading: false,
          });
        } else {
          setSession({ user: null, loading: false });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sbSession) => {
        if (sbSession) {
          setSession({
            user: {
              id: sbSession.user.id,
              email: sbSession.user.email || '',
              user_metadata: sbSession.user.user_metadata,
            },
            loading: false,
          });
        } else {
          setSession({ user: null, loading: false });
          // Clear app state on signout
          clearAppState();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local Mode Session Initialization
      const localUser = localStorage.getItem('studentflow_simulated_user');
      if (localUser) {
        setSession({
          user: JSON.parse(localUser),
          loading: false,
        });
      } else {
        setSession({ user: null, loading: false });
      }
    }
  }, []);

  const clearAppState = () => {
    setSemesters([]);
    setSubjects([]);
    setAssignments([]);
    setExams([]);
    setGrades([]);
    setAttendance([]);
    setPomodoroSessions([]);
    setStudyChats([]);
    setGoals([]);
    setActiveSemesterState(null);
  };

  // Seed default data for local mode so app doesn't start empty
  const seedLocalData = (userId: string) => {
    const defaultSemesterId = 'demo-sem-1';
    
    const demoSemester: Semester = {
      id: defaultSemesterId,
      user_id: userId,
      school_name: 'State University',
      name: 'Spring 2026',
      academic_year: '2025-2026',
      grading_system: 'GPA',
      is_active: true,
    };

    const demoSubjects: Subject[] = [
      {
        id: 'sub-cs-101',
        semester_id: defaultSemesterId,
        user_id: userId,
        name: 'Introduction to Computer Science',
        code: 'CS 101',
        instructor_name: 'Dr. Alan Turing',
        schedule: 'Mon/Wed 09:00 AM - 10:30 AM',
        room: 'Tech Hall 301',
        color: '#4F46E5', // Indigo
      },
      {
        id: 'sub-math-201',
        semester_id: defaultSemesterId,
        user_id: userId,
        name: 'Calculus II',
        code: 'MATH 201',
        instructor_name: 'Prof. Isaac Newton',
        schedule: 'Tue/Thu 11:00 AM - 12:30 PM',
        room: 'Science Center 104',
        color: '#0EA5E9', // Sky
      },
      {
        id: 'sub-lit-150',
        semester_id: defaultSemesterId,
        user_id: userId,
        name: 'Creative Writing & Lit',
        code: 'LIT 150',
        instructor_name: 'Ms. Virginia Woolf',
        schedule: 'Mon/Wed 02:00 PM - 03:30 PM',
        room: 'Humanities 205',
        color: '#F43F5E', // Rose
      }
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const demoAssignments: Assignment[] = [
      {
        id: 'assign-1',
        subject_id: 'sub-cs-101',
        user_id: userId,
        title: 'Build a Simple Web Server',
        description: 'Implement a basic HTTP server using Node.js without frameworks. Handle routing for home and about pages.',
        deadline: inThreeDays,
        priority: 'high',
        status: 'in progress',
        reminder_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'assign-2',
        subject_id: 'sub-math-201',
        user_id: userId,
        title: 'Problem Set 4: Integration by Parts',
        description: 'Complete problems 1 to 15 on Chapter 7 of the textbook. Show all derivation steps clearly.',
        deadline: inSevenDays,
        priority: 'medium',
        status: 'not started',
      },
      {
        id: 'assign-3',
        subject_id: 'sub-lit-150',
        user_id: userId,
        title: 'Short Story Draft 1',
        description: 'Write a 1500-word short story focusing on character development and stream of consciousness.',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'low',
        status: 'submitted',
      }
    ];

    const demoExams: Exam[] = [
      {
        id: 'exam-1',
        subject_id: 'sub-cs-101',
        user_id: userId,
        title: 'Midterm Coding Exam',
        exam_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        topics: 'Data Structures, Recursion, Time Complexity, OOP principles',
        reminder_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'exam-2',
        subject_id: 'sub-math-201',
        user_id: userId,
        title: 'Calculus Quiz 3',
        exam_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        topics: 'Limits, Derivative rules, Basic integrals',
      }
    ];

    const demoGrades: Grade[] = [
      { id: 'g1', subject_id: 'sub-cs-101', user_id: userId, category: 'quiz', name: 'Quiz 1: Programming Basics', score: 95, max_score: 100, weight: 0.1 },
      { id: 'g2', subject_id: 'sub-cs-101', user_id: userId, category: 'activity', name: 'Lab 1: Recursion Exercises', score: 100, max_score: 100, weight: 0.05 },
      { id: 'g3', subject_id: 'sub-cs-101', user_id: userId, category: 'midterm exam', name: 'Midterm Exam', score: 88, max_score: 100, weight: 0.3 },
      
      { id: 'g4', subject_id: 'sub-math-201', user_id: userId, category: 'quiz', name: 'Quiz 1: Limits', score: 78, max_score: 100, weight: 0.15 },
      { id: 'g5', subject_id: 'sub-math-201', user_id: userId, category: 'quiz', name: 'Quiz 2: Derivation', score: 84, max_score: 100, weight: 0.15 },
      
      { id: 'g6', subject_id: 'sub-lit-150', user_id: userId, category: 'activity', name: 'Weekly Prose Exercise 1', score: 90, max_score: 100, weight: 0.1 },
      { id: 'g7', subject_id: 'sub-lit-150', user_id: userId, category: 'activity', name: 'Weekly Prose Exercise 2', score: 95, max_score: 100, weight: 0.1 }
    ];

    const demoAttendance: Attendance[] = [
      { id: 'a1', subject_id: 'sub-cs-101', user_id: userId, date: todayStr, status: 'present' },
      { id: 'a2', subject_id: 'sub-math-201', user_id: userId, date: todayStr, status: 'present' },
      { id: 'a3', subject_id: 'sub-lit-150', user_id: userId, date: todayStr, status: 'late' },
    ];

    const demoGoals: Goal[] = [
      { id: 'gl1', user_id: userId, title: 'Achieve 3.8 GPA this Semester', status: 'pending', target_date: inSevenDays.split('T')[0] },
      { id: 'gl2', user_id: userId, title: 'Complete Web Server assignment before deadline', status: 'completed', target_date: todayStr },
      { id: 'gl3', user_id: userId, title: 'Maintain 90%+ attendance rate', status: 'pending', target_date: todayStr }
    ];

    const demoChats: StudyChat[] = [
      { id: 'c1', user_id: userId, message: 'Welcome to StudentFlow AI! How can I help you study today? Select a subject or ask any question about programming, calculus, or creative writing.', sender: 'ai', created_at: new Date().toISOString() }
    ];

    localStorage.setItem('studentflow_semesters', JSON.stringify([demoSemester]));
    localStorage.setItem('studentflow_subjects', JSON.stringify(demoSubjects));
    localStorage.setItem('studentflow_assignments', JSON.stringify(demoAssignments));
    localStorage.setItem('studentflow_exams', JSON.stringify(demoExams));
    localStorage.setItem('studentflow_grades', JSON.stringify(demoGrades));
    localStorage.setItem('studentflow_attendance', JSON.stringify(demoAttendance));
    localStorage.setItem('studentflow_goals', JSON.stringify(demoGoals));
    localStorage.setItem('studentflow_chats', JSON.stringify(demoChats));
    localStorage.setItem('studentflow_pomodoro', JSON.stringify([]));

    setSemesters([demoSemester]);
    setSubjects(demoSubjects);
    setAssignments(demoAssignments);
    setExams(demoExams);
    setGrades(demoGrades);
    setAttendance(demoAttendance);
    setGoals(demoGoals);
    setStudyChats(demoChats);
    setPomodoroSessions([]);
    setActiveSemesterState(demoSemester);
  };

  // Load App Data when Session changes
  useEffect(() => {
    if (session.loading) return;

    if (!session.user) {
      clearAppState();
      return;
    }

    const userId = session.user.id;

    if (isLocalMode) {
      // Local Storage Mode
      const storedSems = localStorage.getItem('studentflow_semesters');
      
      if (!storedSems || JSON.parse(storedSems).length === 0) {
        // First run in Local mode, let's seed demo data
        seedLocalData(userId);
      } else {
        // Load existing Local storage data
        const sems: Semester[] = JSON.parse(storedSems);
        const subjs: Subject[] = JSON.parse(localStorage.getItem('studentflow_subjects') || '[]');
        const assns: Assignment[] = JSON.parse(localStorage.getItem('studentflow_assignments') || '[]');
        const exms: Exam[] = JSON.parse(localStorage.getItem('studentflow_exams') || '[]');
        const grds: Grade[] = JSON.parse(localStorage.getItem('studentflow_grades') || '[]');
        const atts: Attendance[] = JSON.parse(localStorage.getItem('studentflow_attendance') || '[]');
        const pmds: PomodoroSession[] = JSON.parse(localStorage.getItem('studentflow_pomodoro') || '[]');
        const chats: StudyChat[] = JSON.parse(localStorage.getItem('studentflow_chats') || '[]');
        const gls: Goal[] = JSON.parse(localStorage.getItem('studentflow_goals') || '[]');

        setSemesters(sems);
        setSubjects(subjs);
        setAssignments(assns);
        setExams(exms);
        setGrades(grds);
        setAttendance(atts);
        setPomodoroSessions(pmds);
        setStudyChats(chats.length > 0 ? chats : [{ id: 'c1', user_id: userId, message: 'Welcome back to StudentFlow AI Study Assistant! Ask me any academic question or study support topics.', sender: 'ai', created_at: new Date().toISOString() }]);
        setGoals(gls);

        const active = sems.find(s => s.is_active) || sems[0] || null;
        setActiveSemesterState(active);
      }
    } else {
      // Supabase Mode
      // We will perform async database fetches for the active user
      fetchSupabaseData(userId);
    }
  }, [session.user, session.loading, isLocalMode]);

  const fetchSupabaseData = async (userId: string) => {
    if (!supabase) return;
    try {
      // 1. Fetch Semesters
      const { data: semsData, error: semsError } = await supabase
        .from('semesters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (semsError) throw semsError;
      const sems: Semester[] = semsData || [];
      setSemesters(sems);
      
      const active = sems.find(s => s.is_active) || sems[0] || null;
      setActiveSemesterState(active);

      if (sems.length > 0) {
        // 2. Fetch Subjects
        const { data: subjsData } = await supabase.from('subjects').select('*');
        setSubjects(subjsData || []);

        // 3. Fetch Assignments
        const { data: assnsData } = await supabase.from('assignments').select('*');
        setAssignments(assnsData || []);

        // 4. Fetch Exams
        const { data: exmsData } = await supabase.from('exams').select('*');
        setExams(exmsData || []);

        // 5. Fetch Grades
        const { data: grdsData } = await supabase.from('grades').select('*');
        setGrades(grdsData || []);

        // 6. Fetch Attendance
        const { data: attsData } = await supabase.from('attendance').select('*');
        setAttendance(attsData || []);
      }

      // 7. Fetch Pomodoro Sessions
      const { data: pmdsData } = await supabase.from('pomodoro_sessions').select('*');
      setPomodoroSessions(pmdsData || []);

      // 8. Fetch Study Chats
      const { data: chatsData } = await supabase.from('study_chats').select('*').order('created_at', { ascending: true });
      setStudyChats(chatsData || []);

      // 9. Fetch Goals
      const { data: glsData } = await supabase.from('goals').select('*');
      setGoals(glsData || []);

    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    }
  };

  // Auth Operations
  const signIn = async (email: string, password: string) => {
    if (isLocalMode) {
      // Simulate sign in
      const fakeUser = {
        id: 'local-user',
        email,
        user_metadata: { full_name: email.split('@')[0] || 'Joseph Student' }
      };
      localStorage.setItem('studentflow_simulated_user', JSON.stringify(fakeUser));
      setSession({ user: fakeUser, loading: false });
      return { error: null };
    } else {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isLocalMode) {
      // Simulate sign up
      const fakeUser = {
        id: 'local-user',
        email,
        user_metadata: { full_name: fullName }
      };
      localStorage.setItem('studentflow_simulated_user', JSON.stringify(fakeUser));
      setSession({ user: fakeUser, loading: false });
      return { error: null };
    } else {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (!error && data.user) {
        // Insert profile row
        await supabase!.from('profiles').insert({
          id: data.user.id,
          school_name: '',
          grading_system: 'GPA',
        });
      }
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    if (isLocalMode) {
      // Simulate Google sign in
      const fakeUser = {
        id: 'local-user',
        email: 'google.student@studentflow.dev',
        user_metadata: { 
          full_name: 'Google Student', 
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' 
        }
      };
      localStorage.setItem('studentflow_simulated_user', JSON.stringify(fakeUser));
      setSession({ user: fakeUser, loading: false });
      return { error: null };
    } else {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '',
        }
      });
      return { error };
    }
  };

  const signOut = async () => {
    if (isLocalMode) {
      localStorage.removeItem('studentflow_simulated_user');
      setSession({ user: null, loading: false });
      clearAppState();
      return { error: null };
    } else {
      const { error } = await supabase!.auth.signOut();
      return { error };
    }
  };

  // Semester Operations
  const addSemester = async (schoolName: string, name: string, academicYear: string, gradingSystem: 'GPA' | 'Percentage' | 'Letter', gradeBreakdown?: GradeBreakdownItem[]) => {
    const userId = session.user?.id || 'local-user';
    const newSem: Semester = {
      id: isLocalMode ? Math.random().toString(36).substr(2, 9) : '',
      user_id: userId,
      school_name: schoolName,
      name,
      academic_year: academicYear,
      grading_system: gradingSystem,
      is_active: true,
      grade_breakdown: gradeBreakdown,
    };

    if (isLocalMode) {
      // Deactivate other semesters first
      const updatedSems = semesters.map(s => ({ ...s, is_active: false }));
      const finalSems = [...updatedSems, newSem];
      setSemesters(finalSems);
      localStorage.setItem('studentflow_semesters', JSON.stringify(finalSems));
      setActiveSemesterState(newSem);
      return newSem;
    } else {
      // Supabase
      // Deactivate all others first
      await supabase!.from('semesters').update({ is_active: false }).eq('user_id', userId);
      const { data, error } = await supabase!
        .from('semesters')
        .insert({
          user_id: userId,
          school_name: schoolName,
          name,
          academic_year: academicYear,
          grading_system: gradingSystem,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      // Store grade_breakdown locally since it may not be in DB schema
      const semWithBreakdown = { ...data, grade_breakdown: gradeBreakdown };
      setSemesters([semWithBreakdown, ...semesters.map(s => ({ ...s, is_active: false }))]);
      setActiveSemesterState(semWithBreakdown);
      await supabase!.from('profiles').upsert({ id: userId, school_name: schoolName, grading_system: gradingSystem });
      return semWithBreakdown;
    }
  };

  const setActiveSemester = async (id: string) => {
    if (isLocalMode) {
      const updated = semesters.map(s => ({ ...s, is_active: s.id === id }));
      setSemesters(updated);
      localStorage.setItem('studentflow_semesters', JSON.stringify(updated));
      setActiveSemesterState(updated.find(s => s.id === id) || null);
    } else {
      const userId = session.user?.id;
      await supabase!.from('semesters').update({ is_active: false }).eq('user_id', userId);
      await supabase!.from('semesters').update({ is_active: true }).eq('id', id);
      setSemesters(semesters.map(s => ({ ...s, is_active: s.id === id })));
      setActiveSemesterState(semesters.find(s => s.id === id) || null);
    }
  };

  // Subject Operations
  const addSubject = async (subj: Omit<Subject, 'id' | 'user_id' | 'semester_id'>) => {
    const userId = session.user?.id || 'local-user';
    const semId = activeSemester?.id || 'demo-sem-1';
    
    if (isLocalMode) {
      const newSubj: Subject = {
        ...subj,
        id: 'sub-' + Math.random().toString(36).substr(2, 9),
        semester_id: semId,
        user_id: userId,
      };
      const updated = [...subjects, newSubj];
      setSubjects(updated);
      localStorage.setItem('studentflow_subjects', JSON.stringify(updated));
      return newSubj;
    } else {
      const { data, error } = await supabase!
        .from('subjects')
        .insert({
          ...subj,
          semester_id: semId,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      setSubjects([...subjects, data]);
      return data;
    }
  };

  const editSubject = async (id: string, updates: Partial<Subject>) => {
    if (isLocalMode) {
      const updated = subjects.map(s => s.id === id ? { ...s, ...updates } : s);
      setSubjects(updated);
      localStorage.setItem('studentflow_subjects', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('subjects').update(updates).eq('id', id);
      if (error) throw error;
      setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteSubject = async (id: string) => {
    if (isLocalMode) {
      const updated = subjects.filter(s => s.id !== id);
      setSubjects(updated);
      localStorage.setItem('studentflow_subjects', JSON.stringify(updated));
      
      // Cascade delete client side
      const filterAss = assignments.filter(a => a.subject_id !== id);
      setAssignments(filterAss);
      localStorage.setItem('studentflow_assignments', JSON.stringify(filterAss));

      const filterExms = exams.filter(e => e.subject_id !== id);
      setExams(filterExms);
      localStorage.setItem('studentflow_exams', JSON.stringify(filterExms));

      const filterGrds = grades.filter(g => g.subject_id !== id);
      setGrades(filterGrds);
      localStorage.setItem('studentflow_grades', JSON.stringify(filterGrds));

      const filterAtt = attendance.filter(a => a.subject_id !== id);
      setAttendance(filterAtt);
      localStorage.setItem('studentflow_attendance', JSON.stringify(filterAtt));
    } else {
      const { error } = await supabase!.from('subjects').delete().eq('id', id);
      if (error) throw error;
      setSubjects(subjects.filter(s => s.id !== id));
      setAssignments(assignments.filter(a => a.subject_id !== id));
      setExams(exams.filter(e => e.subject_id !== id));
      setGrades(grades.filter(g => g.subject_id !== id));
      setAttendance(attendance.filter(a => a.subject_id !== id));
    }
  };

  // Assignment Operations
  const addAssignment = async (assign: Omit<Assignment, 'id' | 'user_id'>) => {
    const userId = session.user?.id || 'local-user';
    if (isLocalMode) {
      const newAssign: Assignment = {
        ...assign,
        id: 'assign-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
      };
      const updated = [...assignments, newAssign];
      setAssignments(updated);
      localStorage.setItem('studentflow_assignments', JSON.stringify(updated));
      return newAssign;
    } else {
      const { data, error } = await supabase!
        .from('assignments')
        .insert({
          ...assign,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      setAssignments([...assignments, data]);
      return data;
    }
  };

  const editAssignment = async (id: string, updates: Partial<Assignment>) => {
    if (isLocalMode) {
      const updated = assignments.map(a => a.id === id ? { ...a, ...updates } : a);
      setAssignments(updated);
      localStorage.setItem('studentflow_assignments', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('assignments').update(updates).eq('id', id);
      if (error) throw error;
      setAssignments(assignments.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  };

  const deleteAssignment = async (id: string) => {
    if (isLocalMode) {
      const updated = assignments.filter(a => a.id !== id);
      setAssignments(updated);
      localStorage.setItem('studentflow_assignments', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('assignments').delete().eq('id', id);
      if (error) throw error;
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  // Exam Operations
  const addExam = async (exm: Omit<Exam, 'id' | 'user_id'>) => {
    const userId = session.user?.id || 'local-user';
    if (isLocalMode) {
      const newExam: Exam = {
        ...exm,
        id: 'exam-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
      };
      const updated = [...exams, newExam];
      setExams(updated);
      localStorage.setItem('studentflow_exams', JSON.stringify(updated));
      return newExam;
    } else {
      const { data, error } = await supabase!
        .from('exams')
        .insert({
          ...exm,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      setExams([...exams, data]);
      return data;
    }
  };

  const editExam = async (id: string, updates: Partial<Exam>) => {
    if (isLocalMode) {
      const updated = exams.map(e => e.id === id ? { ...e, ...updates } : e);
      setExams(updated);
      localStorage.setItem('studentflow_exams', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('exams').update(updates).eq('id', id);
      if (error) throw error;
      setExams(exams.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  };

  const deleteExam = async (id: string) => {
    if (isLocalMode) {
      const updated = exams.filter(e => e.id !== id);
      setExams(updated);
      localStorage.setItem('studentflow_exams', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('exams').delete().eq('id', id);
      if (error) throw error;
      setExams(exams.filter(e => e.id !== id));
    }
  };

  // Grade Operations
  const addGrade = async (grd: Omit<Grade, 'id' | 'user_id'>) => {
    const userId = session.user?.id || 'local-user';
    if (isLocalMode) {
      const newGrade: Grade = {
        ...grd,
        id: 'grade-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
      };
      const updated = [...grades, newGrade];
      setGrades(updated);
      localStorage.setItem('studentflow_grades', JSON.stringify(updated));
      return newGrade;
    } else {
      const { data, error } = await supabase!
        .from('grades')
        .insert({
          ...grd,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      setGrades([...grades, data]);
      return data;
    }
  };

  const editGrade = async (id: string, updates: Partial<Grade>) => {
    if (isLocalMode) {
      const updated = grades.map(g => g.id === id ? { ...g, ...updates } : g);
      setGrades(updated);
      localStorage.setItem('studentflow_grades', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('grades').update(updates).eq('id', id);
      if (error) throw error;
      setGrades(grades.map(g => g.id === id ? { ...g, ...updates } : g));
    }
  };

  const deleteGrade = async (id: string) => {
    if (isLocalMode) {
      const updated = grades.filter(g => g.id !== id);
      setGrades(updated);
      localStorage.setItem('studentflow_grades', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('grades').delete().eq('id', id);
      if (error) throw error;
      setGrades(grades.filter(g => g.id !== id));
    }
  };

  // Attendance Operations
  const addAttendance = async (att: Omit<Attendance, 'id' | 'user_id'>) => {
    const userId = session.user?.id || 'local-user';
    if (isLocalMode) {
      const newAtt: Attendance = {
        ...att,
        id: 'att-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
      };
      const updated = [...attendance, newAtt];
      setAttendance(updated);
      localStorage.setItem('studentflow_attendance', JSON.stringify(updated));
      return newAtt;
    } else {
      const { data, error } = await supabase!
        .from('attendance')
        .insert({
          ...att,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      setAttendance([...attendance, data]);
      return data;
    }
  };

  const editAttendance = async (id: string, updates: Partial<Attendance>) => {
    if (isLocalMode) {
      const updated = attendance.map(a => a.id === id ? { ...a, ...updates } : a);
      setAttendance(updated);
      localStorage.setItem('studentflow_attendance', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('attendance').update(updates).eq('id', id);
      if (error) throw error;
      setAttendance(attendance.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  };

  const deleteAttendance = async (id: string) => {
    if (isLocalMode) {
      const updated = attendance.filter(a => a.id !== id);
      setAttendance(updated);
      localStorage.setItem('studentflow_attendance', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('attendance').delete().eq('id', id);
      if (error) throw error;
      setAttendance(attendance.filter(a => a.id !== id));
    }
  };

  // Pomodoro
  const addPomodoroSession = async (duration: number, type: 'study' | 'break') => {
    const userId = session.user?.id || 'local-user';
    const newSession: PomodoroSession = {
      id: isLocalMode ? 'pmd-' + Math.random().toString(36).substr(2, 9) : '',
      user_id: userId,
      duration_minutes: duration,
      completed_at: new Date().toISOString(),
      type,
    };

    if (isLocalMode) {
      const updated = [newSession, ...pomodoroSessions];
      setPomodoroSessions(updated);
      localStorage.setItem('studentflow_pomodoro', JSON.stringify(updated));
      return newSession;
    } else {
      const { data, error } = await supabase!
        .from('pomodoro_sessions')
        .insert({
          user_id: userId,
          duration_minutes: duration,
          type,
        })
        .select()
        .single();
      if (error) throw error;
      setPomodoroSessions([data, ...pomodoroSessions]);
      return data;
    }
  };

  // Chat
  const addChatMessage = async (message: string, sender: 'user' | 'ai') => {
    const userId = session.user?.id || 'local-user';
    const newMsg: StudyChat = {
      id: isLocalMode ? 'chat-' + Math.random().toString(36).substr(2, 9) : '',
      user_id: userId,
      message,
      sender,
      created_at: new Date().toISOString(),
    };

    if (isLocalMode) {
      const updated = [...studyChats, newMsg];
      setStudyChats(updated);
      localStorage.setItem('studentflow_chats', JSON.stringify(updated));
      return newMsg;
    } else {
      const { data, error } = await supabase!
        .from('study_chats')
        .insert({
          user_id: userId,
          message,
          sender,
        })
        .select()
        .single();
      if (error) throw error;
      setStudyChats([...studyChats, data]);
      return data;
    }
  };

  const clearChatHistory = () => {
    const userId = session.user?.id || 'local-user';
    if (isLocalMode) {
      const cleared = [{
        id: 'c1',
        user_id: userId,
        message: 'Welcome back to StudentFlow AI Study Assistant! Ask me any academic question.',
        sender: 'ai' as const,
        created_at: new Date().toISOString()
      }];
      setStudyChats(cleared);
      localStorage.setItem('studentflow_chats', JSON.stringify(cleared));
    } else {
      supabase!.from('study_chats').delete().eq('user_id', userId).then(() => {
        setStudyChats([]);
      });
    }
  };

  // Goals
  const addGoal = async (title: string, targetDate: string) => {
    const userId = session.user?.id || 'local-user';
    const newGoal: Goal = {
      id: isLocalMode ? 'goal-' + Math.random().toString(36).substr(2, 9) : '',
      user_id: userId,
      title,
      status: 'pending',
      target_date: targetDate,
    };

    if (isLocalMode) {
      const updated = [...goals, newGoal];
      setGoals(updated);
      localStorage.setItem('studentflow_goals', JSON.stringify(updated));
      return newGoal;
    } else {
      const { data, error } = await supabase!
        .from('goals')
        .insert({
          user_id: userId,
          title,
          status: 'pending',
          target_date: targetDate,
        })
        .select()
        .single();
      if (error) throw error;
      setGoals([...goals, data]);
      return data;
    }
  };

  const toggleGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const nextStatus: 'pending' | 'completed' = goal.status === 'pending' ? 'completed' : 'pending';

    if (isLocalMode) {
      const updated = goals.map(g => g.id === id ? { ...g, status: nextStatus } : g);
      setGoals(updated);
      localStorage.setItem('studentflow_goals', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('goals').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
      setGoals(goals.map(g => g.id === id ? { ...g, status: nextStatus } : g));
    }
  };

  const deleteGoal = async (id: string) => {
    if (isLocalMode) {
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated);
      localStorage.setItem('studentflow_goals', JSON.stringify(updated));
    } else {
      const { error } = await supabase!.from('goals').delete().eq('id', id);
      if (error) throw error;
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  return (
    <DataContext.Provider
      value={{
        session,
        isLocalMode,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        semesters,
        subjects,
        assignments,
        exams,
        grades,
        attendance,
        pomodoroSessions,
        studyChats,
        goals,
        activeSemester,
        addSemester,
        setActiveSemester,
        addSubject,
        editSubject,
        deleteSubject,
        addAssignment,
        editAssignment,
        deleteAssignment,
        addExam,
        editExam,
        deleteExam,
        addGrade,
        editGrade,
        deleteGrade,
        addAttendance,
        editAttendance,
        deleteAttendance,
        addPomodoroSession,
        addChatMessage,
        clearChatHistory,
        addGoal,
        toggleGoal,
        deleteGoal,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
