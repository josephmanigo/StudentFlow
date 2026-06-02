'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

export default function PlannerPage() {
  const {
    subjects,
    assignments,
    exams,
    goals,
    addGoal,
    toggleGoal,
    deleteGoal,
  } = useData();
  const { showToast } = useToast();

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);

  // Current Month/Year for Timeline
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalDate) {
      showToast('Please enter a goal title and target date', 'warning');
      return;
    }

    try {
      await addGoal(newGoalTitle, newGoalDate);
      setNewGoalTitle('');
      showToast('Academic Goal added!');
    } catch (err: any) {
      showToast(err.message || 'Error adding goal', 'error');
    }
  };

  const handleToggleGoal = async (id: string) => {
    try {
      await toggleGoal(id);
      showToast('Goal status updated!');
    } catch (err) {
      showToast('Error updating goal status', 'error');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Delete this goal?')) {
      try {
        await deleteGoal(id);
        showToast('Goal deleted', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error deleting goal', 'error');
      }
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getSubjectColor = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? subj.color : '#0ea5e9';
  };

  // Generate days array for the calendar
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const calendarCells = [];

  // Blank slots for previous month padding
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }

  // Days in month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(currentYear, currentMonth, i));
  }

  // Helper to check what events fall on a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    const dayAssignments = assignments.filter((a) => {
      return a.deadline.split('T')[0] === dateStr;
    });

    const dayExams = exams.filter((e) => {
      return e.exam_date.split('T')[0] === dateStr;
    });

    return {
      assignments: dayAssignments,
      exams: dayExams,
      totalCount: dayAssignments.length + dayExams.length,
    };
  };

  return (
    <div className="space-y-6 text-white animate-fade-in p-2 md:p-4">
      <div className="space-y-1.5">
        <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-xs border border-white/10">
          AGENDA
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight font-sans">
          Academic <span className="font-sans font-extrabold text-sky-100">Planner.</span>
        </h1>
        <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Visualize deadlines, exam schedules, and manage academic goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid View */}
        <div className="lg:col-span-2 bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-xl flex flex-col justify-between text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200/60">PLANNER TIMELINE</span>
              <h3 className="font-sans font-bold text-white text-base mt-0.5">
                Academic Calendar
              </h3>
            </div>
            
            {/* Calendar navigations */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
              <button
                onClick={handlePrevMonth}
                className="px-2.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest text-sky-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
              >
                Prev
              </button>
              <span className="font-bold text-white text-xs px-3 min-w-28 text-center uppercase tracking-wider font-mono">
                {months[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="px-2.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest text-sky-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
              >
                Next
              </button>
            </div>
          </div>

          {/* Scrollable Calendar Container for Mobile Safety */}
          <div className="w-full overflow-x-auto">
            {/* Calendar grid header */}
            <div className="min-w-[600px] lg:min-w-0 grid grid-cols-7 gap-1 text-center font-extrabold text-xs text-sky-200/60 uppercase tracking-widest border-b border-white/10 pb-3 mb-2 font-mono">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar grid cells */}
            <div className="min-w-[600px] lg:min-w-0 grid grid-cols-7 gap-1.5 flex-1 min-h-[300px]">
              {calendarCells.map((cell, idx) => {
                if (cell === null) {
                  return <div key={`empty-${idx}`} className="bg-white/2 rounded-xl border border-dashed border-white/5" />;
                }

                const { assignments: dayAss, exams: dayEx, totalCount } = getEventsForDate(cell);
                const isToday = cell.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={`day-${cell.getDate()}`}
                    className={`p-2 min-h-16 rounded-2xl border flex flex-col justify-between transition-all group ${
                      isToday
                        ? 'bg-white/20 border-white/30 shadow-md shadow-white/5'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-xs font-bold text-left font-mono ${isToday ? 'text-white' : 'text-sky-200/80'}`}>
                      {cell.getDate()}
                    </span>
                    
                    {/* Event indicators */}
                    {totalCount > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 justify-end">
                        {dayAss.map((a) => (
                          <div
                            key={a.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getSubjectColor(a.subject_id) }}
                            title={`Assignment: ${a.title}`}
                          />
                        ))}
                        {dayEx.map((e) => (
                          <div
                            key={e.id}
                            className="w-1.5 h-1.5 rounded-none"
                            style={{ backgroundColor: getSubjectColor(e.subject_id) }}
                            title={`Exam: ${e.title}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-start gap-4 text-xs font-mono font-bold tracking-widest text-sky-200/50 uppercase">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Assignment</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white" />
              <span>Exam</span>
            </span>
          </div>
        </div>

        {/* Academic Goals Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-xl space-y-5 text-white">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200/70">GOALS TRACKER</span>
              <h3 className="font-sans font-bold text-white text-base mt-0.5">
                Academic Goals
              </h3>
            </div>

            {/* Quick Goal Creation Form */}
            <form onSubmit={handleAddGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-sky-200/60 font-mono">Goal Description</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Complete coding project early"
                  className="mt-1.5 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-sky-200/60 font-mono">Target Date</label>
                <input
                  type="date"
                  required
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.97] cursor-pointer"
              >
                Add Goal
              </button>
            </form>

            {/* Goals List */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h4 className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">Active Checklist</h4>
              
              {goals.length === 0 ? (
                <div className="text-center py-6 text-xs text-sky-200/50 font-mono font-bold uppercase tracking-wider">
                  No academic goals logged yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {goals.map((g) => {
                    const isCompleted = g.status === 'completed';
                    
                    return (
                      <div
                        key={g.id}
                        className="p-3 border border-white/10 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-md bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleGoal(g.id)}
                            className="cursor-pointer transition-all shrink-0"
                          >
                            {isCompleted ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 uppercase">
                                Done
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider bg-white/10 text-sky-200 border border-white/10 uppercase hover:bg-white/20 hover:text-white">
                                Todo
                              </span>
                            )}
                          </button>
                          
                          <div className="min-w-0 font-sans">
                            <p className={`font-sans font-semibold text-white text-xs leading-tight ${isCompleted ? 'line-through text-white/40' : ''}`}>
                              {g.title}
                            </p>
                            <p className="text-xs text-sky-200/50 font-mono mt-0.5 uppercase tracking-wider">
                              Target: {new Date(g.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="px-2 py-1 rounded text-[8px] font-mono font-bold tracking-wider bg-rose-500/20 text-rose-250 border border-rose-500/30 hover:bg-rose-500/30 hover:text-rose-200 transition-all uppercase cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
