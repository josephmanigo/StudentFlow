'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useData } from '@/context/DataContext';

const STORAGE_KEY_TOKEN = 'classroom_access_token';
const STORAGE_KEY_COURSES = 'classroom_linked_courses';
const STORAGE_KEY_LAST_SYNC = 'classroom_last_sync';
const STORAGE_KEY_EXPIRY = 'classroom_token_expiry';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'disconnected';

interface ClassroomSyncState {
  isConnected: boolean;
  lastSynced: Date | null;
  syncStatus: SyncStatus;
  linkedCourses: any[];
  syncError: string | null;
  isSyncing: boolean;
}

interface ClassroomSyncContextType extends ClassroomSyncState {
  storeToken: (token: string, courses: any[]) => void;
  disconnect: () => void;
  triggerSync: () => Promise<void>;
}

const ClassroomSyncContext = createContext<ClassroomSyncContextType | undefined>(undefined);

export const useClassroomSync = () => {
  const ctx = useContext(ClassroomSyncContext);
  if (!ctx) throw new Error('useClassroomSync must be used within ClassroomSyncProvider');
  return ctx;
};

export const ClassroomSyncProvider = ({ children }: { children: ReactNode }) => {
  const { syncGoogleClassroomData, session, activeSemester, isLocalMode } = useData();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [linkedCourses, setLinkedCourses] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Load stored state on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
    const coursesRaw = localStorage.getItem(STORAGE_KEY_COURSES);
    const lastSyncRaw = localStorage.getItem(STORAGE_KEY_LAST_SYNC);

    const now = Date.now();
    const tokenValid = token && expiry && now < parseInt(expiry, 10);

    if (tokenValid) {
      tokenRef.current = token!;
      setIsConnected(true);
      setSyncStatus('idle');
      if (coursesRaw) {
        try { setLinkedCourses(JSON.parse(coursesRaw)); } catch {}
      }
      if (lastSyncRaw) {
        setLastSynced(new Date(lastSyncRaw));
      }
    } else if (token) {
      // Token exists but expired - mark disconnected
      setIsConnected(false);
      setSyncStatus('disconnected');
      tokenRef.current = null;
      if (coursesRaw) {
        try { setLinkedCourses(JSON.parse(coursesRaw)); } catch {}
      }
      if (lastSyncRaw) {
        setLastSynced(new Date(lastSyncRaw));
      }
    }
  }, []);

  // Fetch Google Classroom data using the stored token
  const fetchAndSync = useCallback(async () => {
    if (!tokenRef.current || !session?.user?.id) return;

    // Check token expiry before calling API
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
    if (!expiry || Date.now() >= parseInt(expiry, 10)) {
      setIsConnected(false);
      setSyncStatus('disconnected');
      tokenRef.current = null;
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const token = tokenRef.current;
      const courses: any[] = linkedCourses.length > 0 
        ? linkedCourses 
        : JSON.parse(localStorage.getItem(STORAGE_KEY_COURSES) || '[]');

      if (courses.length === 0) {
        setIsSyncing(false);
        setSyncStatus('idle');
        return;
      }

      const courseworkList: any[] = [];
      const materialsList: any[] = [];
      const submissionsList: any[] = [];

      // Fetch in parallel for all linked courses
      await Promise.all(courses.map(async (course: any) => {
        try {
          const [cwRes, subRes, matRes] = await Promise.all([
            fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/-/studentSubmissions?userId=me`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWorkMaterials`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
          ]);

          if (cwRes.status === 401) {
            // Token expired mid-session
            tokenRef.current = null;
            setIsConnected(false);
            setSyncStatus('disconnected');
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            return;
          }

          if (cwRes.ok) {
            const cwData = await cwRes.json();
            if (cwData.courseWork) courseworkList.push(...cwData.courseWork);
          }
          if (subRes.ok) {
            const subData = await subRes.json();
            if (subData.studentSubmissions) submissionsList.push(...subData.studentSubmissions);
          }
          if (matRes.ok) {
            const matData = await matRes.json();
            if (matData.courseWorkMaterials) materialsList.push(...matData.courseWorkMaterials);
          }
        } catch (e) {
          console.warn(`Classroom sync error for course ${course.id}:`, e);
        }
      }));

      // Attach submission state and grades to each coursework item
      courseworkList.forEach(cw => {
        const sub = submissionsList.find((s: any) => s.courseWorkId === cw.id);
        cw.submissionState = sub ? sub.state : null;
        cw.assignedGrade = sub ? sub.assignedGrade : null;
        cw.draftGrade = sub ? sub.draftGrade : null;
      });

      // Filter only assignments (not short answer / multiple choice that are exam-like)
      // Keep: ASSIGNMENT workType only (exclude quiz/MCQ that are used as exams)
      const assignmentsOnly = courseworkList.filter(
        (cw: any) => cw.workType === 'ASSIGNMENT' || cw.workType === 'SHORT_ANSWER_QUESTION'
      );

      await syncGoogleClassroomData({
        courses,
        coursework: assignmentsOnly,
        materials: materialsList,
      });

      const now = new Date();
      setLastSynced(now);
      setSyncStatus('success');
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, now.toISOString());

      // Reset to idle after 3 seconds
      setTimeout(() => setSyncStatus(prev => prev === 'success' ? 'idle' : prev), 3000);
    } catch (err: any) {
      console.error('Classroom realtime sync error:', err);
      setSyncError(err.message || 'Sync failed');
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }, [syncGoogleClassroomData, session, linkedCourses]);

  // Set up polling interval when connected
  useEffect(() => {
    if (isConnected && tokenRef.current) {
      // Immediate sync when connected
      fetchAndSync();

      // Poll every 5 minutes
      intervalRef.current = setInterval(fetchAndSync, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, fetchAndSync]);

  // Sync on tab focus (user comes back to the app)
  useEffect(() => {
    const handleFocus = () => {
      if (isConnected && tokenRef.current) {
        // Only sync if it's been more than 1 minute since last sync
        const lastSyncRaw = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
        if (lastSyncRaw) {
          const elapsed = Date.now() - new Date(lastSyncRaw).getTime();
          if (elapsed > 60 * 1000) {
            fetchAndSync();
          }
        } else {
          fetchAndSync();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isConnected, fetchAndSync]);

  const storeToken = useCallback((token: string, courses: any[]) => {
    // Google OAuth tokens last ~1 hour (3600 seconds)
    const expiry = Date.now() + 55 * 60 * 1000; // 55 min to be safe
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_EXPIRY, expiry.toString());
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));

    tokenRef.current = token;
    setLinkedCourses(courses);
    setIsConnected(true);
    setSyncStatus('idle');
    setSyncError(null);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
    tokenRef.current = null;
    setIsConnected(false);
    setSyncStatus('disconnected');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const triggerSync = useCallback(async () => {
    await fetchAndSync();
  }, [fetchAndSync]);

  return (
    <ClassroomSyncContext.Provider value={{
      isConnected,
      lastSynced,
      syncStatus,
      linkedCourses,
      syncError,
      isSyncing,
      storeToken,
      disconnect,
      triggerSync,
    }}>
      {children}
    </ClassroomSyncContext.Provider>
  );
};
