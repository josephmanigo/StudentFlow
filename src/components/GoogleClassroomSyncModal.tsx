'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

interface GoogleClassroomSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLocal?: (data: { courses: any[]; coursework: any[]; materials: any[] }) => void;
}

export default function GoogleClassroomSyncModal({ isOpen, onClose, onImportLocal }: GoogleClassroomSyncModalProps) {
  const { syncGoogleClassroomData } = useData();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const clientID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!isOpen) return null;

  const handleAuth = () => {
    if (!clientID) {
      showToast("Google Client ID not configured. Please use Demo Mock Import.", "warning");
      return;
    }

    if (typeof window === 'undefined' || !(window as any).google) {
      showToast("Google accounts API not loaded yet. Please wait.", "error");
      return;
    }

    setLoading(true);
    setLoadingMessage('Initializing Google OAuth...');
    setError(null);

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientID,
        scope: 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setLoading(false);
            setError(tokenResponse.error_description || 'Authentication failed');
            showToast(tokenResponse.error_description || "Authentication failed", "error");
            return;
          }
          
          setToken(tokenResponse.access_token);
          await fetchCourses(tokenResponse.access_token);
        },
        error_callback: (err: any) => {
          setLoading(false);
          setError(err.message || 'OAuth Client Error');
          showToast(err.message || "OAuth Client Error", "error");
        }
      });
      client.requestAccessToken();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to initialize Google Auth');
    }
  };

  const fetchCourses = async (accessToken: string) => {
    setLoading(true);
    setLoadingMessage('Fetching your active courses from Google Classroom...');
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!res.ok) {
        throw new Error(`Google Classroom API error: ${res.statusText}`);
      }

      const data = await res.json();
      const activeCourses = data.courses || [];
      
      setCourses(activeCourses);
      // Auto-select all courses initially
      setSelectedCourseIds(activeCourses.map((c: any) => c.id));
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Classroom courses');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedCourseIds.length === 0) {
      showToast("Please select at least one course to import.", "warning");
      return;
    }

    setLoading(true);
    setLoadingMessage('Fetching coursework and importing to workspace...');

    try {
      const courseworkList: any[] = [];
      const materialsList: any[] = [];
      const submissionsList: any[] = [];

      // Fetch coursework, submissions, and materials in parallel for selected courses
      await Promise.all(selectedCourseIds.map(async (courseId) => {
        // Fetch CourseWork
        try {
          const cwRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (cwRes.ok) {
            const cwData = await cwRes.json();
            if (cwData.courseWork) {
              courseworkList.push(...cwData.courseWork);
            }
          }
        } catch (e) {
          console.error(`Error loading coursework for ${courseId}:`, e);
        }

        // Fetch Student Submissions
        try {
          const subRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/-/studentSubmissions?userId=me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            if (subData.studentSubmissions) {
              submissionsList.push(...subData.studentSubmissions);
            }
          }
        } catch (e) {
          console.error(`Error loading submissions for ${courseId}:`, e);
        }

        // Fetch CourseWorkMaterials
        try {
          const matRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (matRes.ok) {
            const matData = await matRes.json();
            if (matData.courseWorkMaterials) {
              materialsList.push(...matData.courseWorkMaterials);
            }
          }
        } catch (e) {
          console.error(`Error loading materials for ${courseId}:`, e);
        }
      }));

      // Attach submissionState, assignedGrade, and draftGrade to each coursework item
      courseworkList.forEach(cw => {
        const sub = submissionsList.find(s => s.courseWorkId === cw.id);
        cw.submissionState = sub ? sub.state : null;
        cw.assignedGrade = sub ? sub.assignedGrade : null;
        cw.draftGrade = sub ? sub.draftGrade : null;
      });

      const selectedCoursesData = courses.filter((c) => selectedCourseIds.includes(c.id));

      if (onImportLocal) {
        onImportLocal({
          courses: selectedCoursesData,
          coursework: courseworkList,
          materials: materialsList,
        });
        showToast(`Selected ${selectedCoursesData.length} courses to import!`, "success");
        onClose();
        return;
      }

      setLoadingMessage('Saving courses, assignments, and embedding notes in RAG...');
      const result = await syncGoogleClassroomData({
        courses: selectedCoursesData,
        coursework: courseworkList,
        materials: materialsList,
      });

      showToast(`Successfully imported ${result.importedSubjects} courses, ${result.importedAssignments} assignments, and ${result.importedExams} exams!`, "success");
      onClose();
    } catch (err: any) {
      showToast(err.message || "Import failed", "error");
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMockSync = async () => {
    setLoading(true);
    setLoadingMessage('Simulating Google Classroom OAuth connection...');
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingMessage('Simulating coursework notes embedding in vector DB...');
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const mockCourses = [
        { id: "mock-class-1", name: "Modern Artificial Intelligence", section: "CSE 401", descriptionHeading: "Tue/Thu 1:30 PM - 3:00 PM", room: "Annex 102" },
        { id: "mock-class-2", name: "Data Structures & Algorithms", section: "CSE 202", descriptionHeading: "Mon/Wed 10:30 AM - 12:00 PM", room: "Tech Building 205" }
      ];

      const mockCoursework = [
        {
          id: "mock-cw-1",
          courseId: "mock-class-1",
          title: "Assignment 1: Neural Network from Scratch",
          description: "Implement a two-layer backpropagation neural network using NumPy and train it on MNIST dataset.",
          dueDate: { year: 2026, month: 6, day: 14 },
          dueTime: { hours: 23, minutes: 59 },
          workType: "ASSIGNMENT"
        },
        {
          id: "mock-cw-2",
          courseId: "mock-class-1",
          title: "Quiz 1: Perceptrons and Optimization",
          description: "Covers linear classifiers, gradient descent, learning rates, and perceptron convergence theorem.",
          dueDate: { year: 2026, month: 6, day: 18 },
          dueTime: { hours: 10, minutes: 0 },
          workType: "MULTIPLE_CHOICE_QUESTION"
        },
        {
          id: "mock-cw-3",
          courseId: "mock-class-2",
          title: "Programming Exam 1: Balanced Trees",
          description: "Code and verify AVL and Red-Black tree insertion/deletion properties.",
          dueDate: { year: 2026, month: 6, day: 22 },
          dueTime: { hours: 14, minutes: 30 },
          workType: "ASSIGNMENT"
        }
      ];

      const mockMaterials = [
        {
          id: "mock-mat-1",
          courseId: "mock-class-1",
          title: "Classroom Notes: Introduction to Neural Networks",
          description: "Summary of neural network architectures, sigmoid and relu activation functions, and gradient descent optimization.",
          alternateLink: "https://classroom.google.com/c/mock-1/m/notes-1"
        },
        {
          id: "mock-mat-2",
          courseId: "mock-class-2",
          title: "Study Guide: AVL Tree Rotations",
          description: "Step-by-step description of Single Left (RR), Single Right (LL), Double Left-Right (LR), and Double Right-Left (RL) rotations.",
          alternateLink: "https://classroom.google.com/c/mock-2/m/notes-2"
        }
      ];

      if (onImportLocal) {
        onImportLocal({
          courses: mockCourses,
          coursework: mockCoursework,
          materials: mockMaterials
        });
        showToast(`(Demo) Selected ${mockCourses.length} courses to import!`, "success");
        onClose();
        return;
      }

      const result = await syncGoogleClassroomData({
        courses: mockCourses,
        coursework: mockCoursework,
        materials: mockMaterials
      });

      showToast(`(Demo) Successfully imported ${result.importedSubjects} courses, ${result.importedAssignments} assignments, and ${result.importedExams} exams!`, "success");
      onClose();
    } catch (err: any) {
      showToast(err.message || "Mock sync failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <div className="bg-slate-900/95 border border-white/15 backdrop-blur-xl text-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-mono font-bold text-white text-xs uppercase tracking-[0.18em] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Google Classroom Import
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sky-200 hover:text-white font-mono font-bold uppercase tracking-wider text-[10px] cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                <div className="absolute inset-0 rounded-full border-4 border-sky-400 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-sm font-mono text-sky-200 text-center max-w-xs">{loadingMessage}</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-9 h-9 text-emerald-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                    <path d="M22 18.97l-2 .54v-1.3l2-.54v1.3zm-4 1.08l-2 .54v-1.3l2-.54v1.3zm-4 1.08l-2 .54v-1.3l2-.54v1.3z" opacity=".3"/>
                    <path d="M4 14.07v4.61c0 .52.33.99.82 1.16l7 2.33c.12.04.24.06.36.06.12 0 .24-.02.36-.06l7-2.33c.49-.16.82-.63.82-1.16v-4.61l-8.18 4.46a.375.375 0 01-.36 0L4 14.07z"/>
                  </svg>
                </div>
                <h2 className="text-lg font-bold font-sans">Sync Classroom Dashboard</h2>
                <p className="text-xs text-sky-200/60 font-medium max-w-sm mx-auto">
                  Import your courses, coursework deadlines, assignments, quizzes, and class materials directly into your workspace.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs font-semibold">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400">✓</span>
                  <p className="text-sky-100/95">Courses imported automatically as Subjects.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400">✓</span>
                  <p className="text-sky-100/95">Coursework deadlines populated into Planner Calendar.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400">✓</span>
                  <p className="text-sky-100/95">Class notes and materials parsed & uploaded into AI Assistant.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {clientID ? (
                  <button
                    onClick={handleAuth}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    Connect Google Classroom
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-2xs font-semibold text-center">
                      NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in .env.local
                    </div>
                    <button
                      onClick={handleMockSync}
                      className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 active:scale-[0.98] text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Demo Mock Import
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm font-bold font-sans">Select Courses to Import</h4>
                <p className="text-[11px] text-sky-200/50 font-semibold uppercase font-mono">Select courses you are enrolled in this semester.</p>
              </div>

              {courses.length === 0 ? (
                <div className="p-8 text-center text-sky-200/50 text-xs font-semibold border border-dashed border-white/10 rounded-2xl">
                  No active courses found in Google Classroom.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                  {courses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    return (
                      <div
                        key={course.id}
                        onClick={() => toggleCourseSelection(course.id)}
                        className={`p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-white/12 border-white/25 shadow-md'
                            : 'bg-white/5 border-white/10 hover:bg-white/8'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-xs font-bold text-white truncate">{course.name}</p>
                          <p className="text-[10px] font-mono text-sky-200/50 uppercase tracking-wider mt-0.5 truncate">
                            {course.section || 'No Section'} • {course.room || 'No Room'}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 text-transparent'
                        }`}>
                          <svg className="w-3 h-3 fill-current font-bold" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 px-4 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-[9px] font-mono font-bold uppercase tracking-[0.18em] rounded-xl transition-all cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedCourseIds.length === 0}
                  className="flex-1 py-2.5 px-5 bg-white hover:bg-sky-50 disabled:bg-white/40 disabled:text-[#6495ED]/40 text-[#6495ED] text-[9px] font-mono font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer text-center"
                >
                  Import ({selectedCourseIds.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
