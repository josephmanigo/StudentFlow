'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { GradeBreakdownItem } from '@/types';

interface LocalSubject {
  name: string;
  code: string;
  instructor_name: string;
  schedule: string;
  room: string;
  color: string;
}

const colorPalettes = [
  '#0ea5e9', // Sky Blue
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
];

export default function OnboardingPage() {
  const { session, addSemester, addSubject } = useData();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Semester info fields
  const [schoolName, setSchoolName] = useState('');
  const [semesterName, setSemesterName] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [gradingSystem, setGradingSystem] = useState<'GPA' | 'Percentage' | 'Letter'>('GPA');

  // Grade Breakdown rows
  const defaultBreakdown: GradeBreakdownItem[] = [
    { category: 'Written Work', weight: 25 },
    { category: 'Performance Task', weight: 50 },
    { category: 'Quarterly Assessment', weight: 25 },
  ];
  const [gradeBreakdown, setGradeBreakdown] = useState<GradeBreakdownItem[]>(defaultBreakdown);
  const [newCategory, setNewCategory] = useState('');
  const [newWeight, setNewWeight] = useState('');

  // Subjects fields
  const [subjectList, setSubjectList] = useState<LocalSubject[]>([]);
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjInstructor, setSubjInstructor] = useState('');
  const [subjSchedule, setSubjSchedule] = useState('');
  const [subjRoom, setSubjRoom] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorPalettes[0]);

  // Schedule picker helper states
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [isCustomSchedule, setIsCustomSchedule] = useState(false);

  // Helper: Format 24h string to 12h AM/PM
  const format12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Update schedule text automatically when picker states change
  useEffect(() => {
    if (!isCustomSchedule) {
      if (selectedDays.length > 0) {
        const daysStr = selectedDays.join('/');
        const startFormatted = format12Hour(startTime);
        const endFormatted = format12Hour(endTime);
        setSubjSchedule(`${daysStr} ${startFormatted} - ${endFormatted}`);
      } else {
        setSubjSchedule('');
      }
    }
  }, [selectedDays, startTime, endTime, isCustomSchedule]);

  const currentTotal = gradeBreakdown.reduce((sum, r) => sum + r.weight, 0);
  const remainingWeight = 100 - currentTotal;
  const isTotal100 = Math.round(currentTotal) === 100;

  useEffect(() => {
    if (!session.loading && !session.user) {
      router.push('/auth');
    }
  }, [session.user, session.loading, router]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!schoolName || !semesterName || !academicYear) {
        showToast('Please fill out all semester details', 'warning');
        return;
      }
      if (!isTotal100) {
        showToast(`Grade breakdown must total exactly 100%. Currently: ${currentTotal}%`, 'warning');
        return;
      }
      setStep(2);
    }
  };

  const handleAddBreakdownRow = () => {
    if (!newCategory.trim()) {
      showToast('Please enter a category name', 'warning');
      return;
    }
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) {
      showToast('Weight must be a number greater than 0', 'warning');
      return;
    }
    if (remainingWeight <= 0) {
      showToast('Grade breakdown is already at 100%. Remove or reduce other components first.', 'warning');
      return;
    }
    if (w > remainingWeight) {
      showToast(`Adding this component would exceed 100%. Maximum allowed: ${remainingWeight}%`, 'warning');
      return;
    }
    setGradeBreakdown([...gradeBreakdown, { category: newCategory.trim(), weight: w }]);
    setNewCategory('');
    setNewWeight('');
  };

  const handleRemoveBreakdownRow = (idx: number) => {
    setGradeBreakdown(gradeBreakdown.filter((_, i) => i !== idx));
  };

  const handleBreakdownWeightChange = (idx: number, val: string) => {
    const w = parseFloat(val);
    if (isNaN(w)) return;
    const otherRowsWeight = gradeBreakdown.reduce((sum, r, i) => i !== idx ? sum + r.weight : sum, 0);
    const maxAllowed = 100 - otherRowsWeight;
    const cappedWeight = Math.max(0, Math.min(maxAllowed, w));
    const updated = gradeBreakdown.map((r, i) =>
      i === idx ? { ...r, weight: cappedWeight } : r
    );
    setGradeBreakdown(updated);
  };

  const handleBreakdownCategoryChange = (idx: number, val: string) => {
    const updated = gradeBreakdown.map((r, i) =>
      i === idx ? { ...r, category: val } : r
    );
    setGradeBreakdown(updated);
  };

  const handleAddSubjectToList = () => {
    if (!subjName) {
      showToast('Subject Name is required', 'warning');
      return;
    }
    const newSubj: LocalSubject = {
      name: subjName,
      code: subjCode,
      instructor_name: subjInstructor,
      schedule: subjSchedule,
      room: subjRoom,
      color: selectedColor,
    };
    setSubjectList([...subjectList, newSubj]);
    
    // Clear inputs
    setSubjName('');
    setSubjCode('');
    setSubjInstructor('');
    setSubjSchedule('');
    setSubjRoom('');

    // Reset picker helper states
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('10:30');
    setIsCustomSchedule(false);

    // Select next color palette
    const nextColorIndex = (colorPalettes.indexOf(selectedColor) + 1) % colorPalettes.length;
    setSelectedColor(colorPalettes[nextColorIndex]);
    showToast(`${subjName} added to setup list!`);
  };

  const handleRemoveSubjectFromList = (index: number) => {
    setSubjectList(subjectList.filter((_, i) => i !== index));
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Create Semester with grade breakdown
      await addSemester(schoolName, semesterName, academicYear, gradingSystem, gradeBreakdown.length > 0 ? gradeBreakdown : undefined);
      
      // 2. Create Subjects if any
      if (subjectList.length > 0) {
        for (const subj of subjectList) {
          await addSubject({
            name: subj.name,
            code: subj.code,
            instructor_name: subj.instructor_name,
            schedule: subj.schedule,
            room: subj.room,
            color: subj.color,
          });
        }
      }

      showToast('Academic setup completed successfully!');
      router.push('/dashboard');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error completing onboarding';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#6495ED] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-white font-sans">
      
      {/* Decorative blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px] pointer-events-none z-0" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl z-10 text-center px-4 flex flex-col items-center">
        <div className="flex items-center gap-1.5 mb-3">
          <img
            src="/studentflow_logo.png"
            alt="StudentFlow Logo"
            width={64}
            height={64}
            className="w-16 h-16 object-contain shrink-0"
          />
          <span className="font-black text-2xl tracking-tighter text-white uppercase">StudentFlow</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Configure <span className="font-serif italic font-normal text-sky-100">Workspace.</span>
        </h1>
        
        <p className="mt-2 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-sky-100/70">
          Let&apos;s build your semester setup.
        </p>

        {/* Progress Tracker */}
        <div className="mt-8 flex justify-center items-center gap-2.5 max-w-xs mx-auto">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-12 bg-white' : 'w-4 bg-white/20'}`} />
          <span className="text-[9px] font-mono font-bold text-sky-100 uppercase tracking-widest">Semester</span>
          <div className="w-6 border-t border-white/20" />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-12 bg-white' : 'w-4 bg-white/20'}`} />
          <span className="text-[9px] font-mono font-bold text-sky-100 uppercase tracking-widest">Subjects</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl z-10 px-4 sm:px-0">
        <div className="bg-white/10 border border-white/20 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-[32px] shadow-2xl relative overflow-hidden">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded-md font-mono font-bold tracking-[0.2em] text-[8px] border border-white/10">Step 1 of 2</span>
                <h3 className="text-xl font-sans font-extrabold text-white mt-2">Semester Setup</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">School / University</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. State University"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Semester</label>
                  <input
                    type="text"
                    required
                    value={semesterName}
                    onChange={(e) => setSemesterName(e.target.value)}
                    placeholder="1st Semester / 2nd Semester"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Grading Scale</label>
                  <select
                    value={gradingSystem}
                    onChange={(e) => setGradingSystem(e.target.value as 'GPA' | 'Percentage' | 'Letter')}
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-semibold cursor-pointer"
                  >
                    <option value="GPA" className="bg-[#6495ED] text-white font-semibold">GPA (4.0 Scale)</option>
                    <option value="Percentage" className="bg-[#6495ED] text-white font-semibold">Percentage (100%)</option>
                    <option value="Letter" className="bg-[#6495ED] text-white font-semibold">Letter Grades (A, B, C...)</option>
                  </select>
                </div>
              </div>

              {/* Grade Breakdown Builder */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Grade Breakdown Components</span>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isTotal100 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                    <span className="text-[9px] font-mono font-bold tracking-widest opacity-70">TOTAL</span>
                    <span className="font-black font-mono text-sm">{Math.round(currentTotal)}%</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {gradeBreakdown.map((row, idx) => {
                    const otherRowsWeight = gradeBreakdown.reduce((sum, r, i) => i !== idx ? sum + r.weight : sum, 0);
                    const isAtMax = row.weight >= (100 - otherRowsWeight);
                    return (
                      <div key={idx} className="group flex items-center gap-3 p-3 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl transition-all">
                        <input
                          type="text"
                          value={row.category}
                          onChange={(e) => handleBreakdownCategoryChange(idx, e.target.value)}
                          className="flex-1 bg-transparent text-xs font-semibold text-white placeholder-white/30 focus:outline-none min-w-0"
                          placeholder="Category name"
                        />
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1">
                            <button
                              type="button"
                              disabled={row.weight <= 0}
                              onClick={() => handleBreakdownWeightChange(idx, String(row.weight - 1))}
                              className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-mono font-black text-sm text-white">{row.weight}%</span>
                            <button
                              type="button"
                              disabled={isAtMax}
                              onClick={() => handleBreakdownWeightChange(idx, String(row.weight + 1))}
                              className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              +
                            </button>
                          </div>
                          <button type="button" onClick={() => handleRemoveBreakdownRow(idx)} className="text-white/20 hover:text-rose-300 transition-colors cursor-pointer text-base font-bold opacity-0 group-hover:opacity-100">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 p-2 bg-black/10 rounded-2xl border border-white/5">
                  <input
                    type="text"
                    value={newCategory}
                    disabled={remainingWeight <= 0}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder={remainingWeight <= 0 ? "At 100% capacity" : "New category..."}
                    className="flex-1 bg-transparent px-3 py-2 text-xs focus:outline-none placeholder:text-white/30 disabled:opacity-50"
                  />
                  <input
                    type="number"
                    value={newWeight}
                    disabled={remainingWeight <= 0}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder={remainingWeight <= 0 ? "0" : "%"}
                    className="w-16 bg-transparent text-center text-xs font-mono font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                  />
                  <button
                    disabled={remainingWeight <= 0}
                    onClick={handleAddBreakdownRow}
                    className="px-4 py-2 bg-white text-[#6495ED] rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleNextStep}
                  disabled={!isTotal100}
                  className="py-4 px-8 bg-white hover:bg-sky-50 text-[#6495ED] text-xs font-bold font-mono uppercase tracking-[0.25em] rounded-2xl transition-all shadow-lg hover:shadow-white/10 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center min-h-[50px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100 disabled:shadow-none"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded-md font-mono font-bold tracking-[0.2em] text-[8px] border border-white/10">Step 2 of 2</span>
                <h3 className="text-xl font-sans font-extrabold text-white mt-2">Add Your Subjects</h3>
              </div>

              {/* Form to add subject */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Subject Name</label>
                  <input
                    type="text"
                    value={subjName}
                    onChange={(e) => setSubjName(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Subject Code</label>
                  <input
                    type="text"
                    value={subjCode}
                    onChange={(e) => setSubjCode(e.target.value)}
                    placeholder="e.g. CS 202"
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Instructor Name</label>
                  <input
                    type="text"
                    value={subjInstructor}
                    onChange={(e) => setSubjInstructor(e.target.value)}
                    placeholder="e.g. Dr. Turing"
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Schedule</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSchedule(!isCustomSchedule)}
                      className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-200 hover:text-white transition-colors cursor-pointer"
                    >
                      {isCustomSchedule ? 'Use Easy Picker' : 'Type Custom Text'}
                    </button>
                  </div>
                  
                  {isCustomSchedule ? (
                    <input
                      type="text"
                      value={subjSchedule}
                      onChange={(e) => setSubjSchedule(e.target.value)}
                      placeholder="e.g. Tue/Thu 11:00 AM"
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                    />
                  ) : (
                    <div className="space-y-3.5 p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                      {/* Days select */}
                      <div>
                        <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-sky-200/50 mb-1.5">Select Days</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                            const isSelected = selectedDays.includes(day);
                            const displayLabels: Record<string, string> = {
                              'Mon': 'M', 'Tue': 'T', 'Wed': 'W', 'Thu': 'Th', 'Fri': 'F', 'Sat': 'S', 'Sun': 'Su'
                            };
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  setSelectedDays(prev => 
                                    prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                                  );
                                }}
                                className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-white text-[#6495ED] border border-white font-extrabold shadow-md' 
                                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                }`}
                              >
                                {displayLabels[day]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Time select */}
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                        <div>
                          <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-sky-200/50 mb-1.5">Start Time</span>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-semibold focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20"
                          />
                        </div>
                        <div>
                          <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-sky-200/50 mb-1.5">End Time</span>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-semibold focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Location / Room</label>
                  <input
                    type="text"
                    value={subjRoom}
                    onChange={(e) => setSubjRoom(e.target.value)}
                    placeholder="e.g. Tech Hall 301"
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Subject Color Accent</label>
                  <div className="flex gap-2.5 pt-1">
                    {colorPalettes.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full cursor-pointer border border-white/20 transition-all ${
                          selectedColor === color ? 'ring-2 ring-white ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleAddSubjectToList}
                    className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-mono font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer border border-white/15 transition-all active:scale-[0.98]"
                  >
                    Add Subject
                  </button>
                </div>
              </div>

              {/* Display added subjects */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-mono font-bold text-sky-100/80 uppercase tracking-widest">Added Subjects ({subjectList.length})</h4>
                
                {subjectList.length === 0 ? (
                  <div className="py-8 border border-dashed border-white/15 rounded-2xl text-center text-sky-200/50 text-xs font-semibold">
                    No subjects added to the config list yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                    {subjectList.map((subj, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 border border-white/15 rounded-xl flex items-center justify-between gap-3 shadow-sm text-white"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-3 h-3 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: subj.color }} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{subj.name}</p>
                            {subj.code && <p className="text-[9px] text-sky-200/60 font-mono tracking-wide mt-0.5">{subj.code}</p>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectFromList(index)}
                          className="text-[9px] font-bold text-rose-300 uppercase tracking-wider hover:text-rose-250 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 text-sky-100 hover:text-white text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Back
                </button>

                <button
                  onClick={handleFinishOnboarding}
                  disabled={loading}
                  className="py-4 px-8 bg-white hover:bg-sky-50 text-[#6495ED] text-xs font-bold font-mono uppercase tracking-[0.25em] rounded-2xl transition-all shadow-lg hover:shadow-white/10 active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center min-h-[50px]"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#6495ED] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    <span>Finish Setup</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
