'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    subjects,
    assignments,
    exams,
    grades,
    attendance,
    goals,
    isLocalMode,
  } = useData();

  // Classes Today (based on weekday)
  const getTodayClasses = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return subjects.filter((s) => {
      if (!s.schedule) return false;
      const sched = s.schedule.toLowerCase();
      const dayAbbr = today.substring(0, 3).toLowerCase();
      return sched.includes(dayAbbr) || sched.includes(today.toLowerCase());
    });
  };

  const todayClasses = getTodayClasses();

  // Upcoming Assignments (sorted by deadline, unsubmitted)
  const upcomingAssignments = assignments
    .filter((a) => a.status !== 'submitted')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  // Exam Countdowns
  const getExamCountdown = () => {
    const todayVal = new Date();
    const upcoming = exams
      .filter((e) => new Date(e.exam_date) >= todayVal)
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());

    if (upcoming.length === 0) return null;

    const nextExam = upcoming[0];
    const diffTime = new Date(nextExam.exam_date).getTime() - todayVal.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      exam: nextExam,
      days: diffDays,
    };
  };

  const nextExamInfo = getExamCountdown();

  // Attendance summary rate
  const getOverallAttendanceRate = () => {
    if (attendance.length === 0) return 100;
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const rate = Math.round(((present + late) / attendance.length) * 100);
    return rate;
  };

  const attendanceRate = getOverallAttendanceRate();

  // Grade Summary
  const getGPAAverage = () => {
    if (grades.length === 0) return '4.0';
    let totalWeight = 0;
    let earnedWeightPoints = 0;
    
    grades.forEach(g => {
      earnedWeightPoints += (g.score / g.max_score) * g.weight;
      totalWeight += g.weight;
    });

    const percent = totalWeight > 0 ? (earnedWeightPoints / totalWeight) * 100 : 90;
    
    if (percent >= 90) return 'A (4.0)';
    if (percent >= 85) return 'B+ (3.5)';
    if (percent >= 80) return 'B (3.0)';
    if (percent >= 75) return 'C+ (2.5)';
    if (percent >= 70) return 'C (2.0)';
    return 'D (1.0)';
  };

  const gpaText = getGPAAverage();

  const getSubjectColor = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? subj.color : '#0ea5e9';
  };

  const getSubjectCode = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? subj.code : 'Course';
  };

  return (
    <div className="space-y-8 animate-fade-in text-white p-2 md:p-4">
      
      {/* Top Banner */}
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-[32px] text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-stretch min-h-[160px]">
        {/* Background glow circle inside banner */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Text Content */}
        <div className="flex-1 p-6 md:p-8 space-y-2 relative z-10 self-center">
          <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-[10px] border border-white/10">
            OVERVIEW
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1.5 leading-tight">
            Simplify your <span className="font-sans font-extrabold text-sky-100">academic life.</span>
          </h1>
          <p className="text-sky-100/90 text-sm font-mono font-bold uppercase tracking-[0.15em]">
            Track classes, deadlines, exams, and consult AI study tools in a unified space.
          </p>
        </div>

        {/* Mascot — centered on mobile, right-bottom on sm+ */}
        <div className="shrink-0 self-center sm:self-end flex items-end justify-center w-40 sm:w-48 md:w-64 mx-auto sm:mx-0 pb-2 sm:pb-0">
          <img
            src="/mascott.png"
            alt="StudentFlow Mascot"
            className="w-full h-auto object-contain drop-shadow-2xl translate-y-1 sm:-translate-x-12"
          />
        </div>
      </div>





      {/* Grid Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Classes Today Card */}
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:bg-white/15 hover:border-white/25 transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono tracking-[0.18em] text-sky-100/80 font-bold uppercase">TODAY&apos;S SCHEDULE</span>
            <Link href="/dashboard/subjects" className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all">
              subjects
            </Link>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {todayClasses.length === 0 ? (
              <div className="py-12 text-center text-sm text-sky-200/50 font-semibold italic">
                No classes scheduled for today.
              </div>
            ) : (
              todayClasses.map((s) => (
                <div key={s.id} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-7 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="min-w-0">
                      <p className="font-sans font-semibold text-base text-white truncate">{s.name}</p>
                      <p className="text-[11px] font-mono text-sky-200/60 truncate mt-0.5">{s.schedule}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-1 bg-white/10 border border-white/10 text-white rounded-lg">
                    {s.room || 'online'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines Card */}
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:bg-white/15 hover:border-white/25 transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono tracking-[0.18em] text-sky-100/80 font-bold uppercase">UPCOMING DEADLINES</span>
            <Link href="/dashboard/assignments" className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all">
              assignments
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAssignments.length === 0 ? (
              <div className="py-12 text-center text-sm text-sky-200/50 font-semibold italic">
                No pending assignments.
              </div>
            ) : (
              upcomingAssignments.map((a) => (
                <div key={a.id} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:bg-white/10 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans font-semibold text-base text-white truncate">{a.title}</p>
                    <p className="text-[11px] font-mono text-sky-200/60 mt-0.5">
                      Due {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold text-white px-2 py-1 rounded-lg uppercase shrink-0 tracking-wider border border-white/10"
                    style={{ backgroundColor: getSubjectColor(a.subject_id) }}
                  >
                    {getSubjectCode(a.subject_id)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Exams & Ticker Countdown */}
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:bg-white/15 hover:border-white/25 transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono tracking-[0.18em] text-sky-100/80 font-bold uppercase">UPCOMING EXAMS</span>
            <Link href="/dashboard/exams" className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all">
              exams
            </Link>
          </div>

          {nextExamInfo ? (
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between h-[110px]">
              <div>
                <p className="font-sans font-semibold text-base text-white truncate">{nextExamInfo.exam.title}</p>
                <p className="text-[11px] font-mono text-sky-200/60 mt-0.5">
                  {new Date(nextExamInfo.exam.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-100/70">Time remaining</span>
                <span className="text-sm font-mono font-extrabold text-white">
                  {nextExamInfo.days === 0
                    ? 'today'
                    : nextExamInfo.days === 1
                    ? 'tomorrow'
                    : `${nextExamInfo.days} days`}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-sky-200/50 font-semibold italic h-[110px] flex items-center justify-center">
              No exams scheduled.
            </div>
          )}
        </div>

        {/* Academic Analytics Stats Row */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* GPA Average summary */}
          <Link href="/dashboard/grades" className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[24px] p-5 flex items-center justify-between hover:bg-white/15 hover:border-white/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 group">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-sky-100/80 font-bold uppercase block">CURRENT GRADE</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 font-mono">{gpaText}</h4>
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white border-b border-white/20 pb-0.5 group-hover:border-white transition-all">
              details
            </span>
          </Link>

          {/* Attendance */}
          <Link href="/dashboard/attendance" className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[24px] p-5 flex items-center justify-between hover:bg-white/15 hover:border-white/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 group">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-sky-100/80 font-bold uppercase block">ATTENDANCE</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 font-mono">{attendanceRate}%</h4>
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white border-b border-white/20 pb-0.5 group-hover:border-white transition-all">
              log
            </span>
          </Link>

          {/* Pomodoro Timer */}
          <Link href="/dashboard/pomodoro" className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[24px] p-5 flex items-center justify-between hover:bg-white/15 hover:border-white/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 group">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-sky-100/80 font-bold uppercase block">FOCUS TIMER</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 font-mono">Focus session</h4>
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white border-b border-white/20 pb-0.5 group-hover:border-white transition-all">
              start
            </span>
          </Link>
        </div>

        {/* AI Assistant Quick Tool */}
        <div className="lg:col-span-2 bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-xl flex flex-col justify-between min-h-48">
          <div className="space-y-2">
            <span className="inline-block px-2 py-0.5 bg-white/10 text-white rounded font-mono font-bold tracking-[0.25em] text-[10px] border border-white/5">
              AI MODULE
            </span>
            <h3 className="font-sans font-extrabold text-white text-lg mt-2">
              Consult StudentFlow Assistant
            </h3>
            <p className="text-xs text-sky-100/75 leading-relaxed max-w-md font-medium">
              Explain formulas, request code snippets, build markdown summaries, and resolve study blocker problems.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-white/10">
            <span className="text-[11px] text-sky-200/60 font-mono font-bold uppercase tracking-widest">
              {isLocalMode ? 'local tokens active' : 'database tokens active'}
            </span>
            <Link
              href="/dashboard/ai-assistant"
              className="py-2.5 px-4.5 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-[11px] uppercase tracking-[0.2em] transition-all shadow-md hover:shadow-white/10 active:scale-[0.97] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ask AI</span>
              <svg className="w-3 h-3 text-[#6495ED] animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c0 5.5-4.5 10-10 10 5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Planner goals widget */}
        <div className="lg:col-span-1 bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:bg-white/15 hover:border-white/25 transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono tracking-[0.18em] text-sky-100/80 font-bold uppercase">PLANNER GOALS</span>
            <Link href="/dashboard/planner" className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all">
              planner
            </Link>
          </div>

          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="py-8 text-center text-sm text-sky-200/50 font-semibold italic">
                No active goals logged.
              </div>
            ) : (
              goals.slice(0, 3).map((g) => (
                <div key={g.id} className="flex items-center gap-2.5 py-1.5 text-sm">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${g.status === 'completed' ? 'bg-white' : 'bg-white/20'}`} />
                  <span className={`truncate text-sm ${g.status === 'completed' ? 'line-through text-white/40' : 'font-medium text-white/90'}`}>
                    {g.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
