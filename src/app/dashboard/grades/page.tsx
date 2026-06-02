'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

export default function GradesPage() {
  const {
    subjects,
    grades,
    addGrade,
    editGrade,
    deleteGrade,
    activeSemester,
  } = useData();
  const { showToast } = useToast();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);

  // Form Fields
  const [category, setCategory] = useState<'quiz' | 'activity' | 'midterm exam' | 'final exam' | 'project' | 'attendance'>('quiz');
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [weight, setWeight] = useState(''); // relative weight in %

  // Target Score Calculator state
  const [targetGrade, setTargetGrade] = useState<number>(90);

  const handleOpenAddModal = () => {
    setEditingGradeId(null);
    setCategory('quiz');
    setName('');
    setScore('');
    setMaxScore('100');
    setWeight('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (grd: any) => {
    setEditingGradeId(grd.id);
    setCategory(grd.category);
    setName(grd.name);
    setScore(grd.score.toString());
    setMaxScore(grd.max_score.toString());
    setWeight((grd.weight * 100).toString());
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !score || !maxScore || !weight || !selectedSubjectId) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    const scoreNum = parseFloat(score);
    const maxScoreNum = parseFloat(maxScore);
    const weightNum = parseFloat(weight) / 100;

    if (isNaN(scoreNum) || isNaN(maxScoreNum) || isNaN(weightNum)) {
      showToast('Scores and weights must be numeric values', 'warning');
      return;
    }

    if (maxScoreNum <= 0) {
      showToast('Max Score must be greater than zero', 'warning');
      return;
    }

    const payload = {
      subject_id: selectedSubjectId,
      category,
      name,
      score: scoreNum,
      max_score: maxScoreNum,
      weight: weightNum,
    };

    try {
      if (editingGradeId) {
        await editGrade(editingGradeId, payload);
        showToast('Grade item updated!');
      } else {
        await addGrade(payload);
        showToast('Grade item added!');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving grade', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this grade item?')) {
      try {
        await deleteGrade(id);
        showToast('Grade item deleted', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error deleting grade', 'error');
      }
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const subjectGrades = grades.filter(g => g.subject_id === selectedSubjectId);

  // Grade computations
  const getGradeCalculations = () => {
    let earnedWeightPoints = 0;
    let totalWeightRatio = 0;
    let hasFinalExam = false;
    let finalExamWeight = 0;

    subjectGrades.forEach(g => {
      const categoryScoreRatio = g.score / g.max_score;
      earnedWeightPoints += categoryScoreRatio * g.weight;
      totalWeightRatio += g.weight;
      
      if (g.category === 'final exam') {
        hasFinalExam = true;
        finalExamWeight = g.weight;
      }
    });

    const currentPercentage = totalWeightRatio > 0 ? (earnedWeightPoints / totalWeightRatio) * 100 : 0;
    
    let neededFinalPercentage: number | null = null;
    const finalsWeight = hasFinalExam ? finalExamWeight : 0.30;
    
    const earnedPointsExceptFinal = subjectGrades
      .filter(g => g.category !== 'final exam')
      .reduce((sum, g) => sum + (g.score / g.max_score) * g.weight, 0);
      
    if (finalsWeight > 0) {
      neededFinalPercentage = ((targetGrade / 100 - earnedPointsExceptFinal) / finalsWeight) * 100;
    }

    const getLetterGrade = (p: number) => {
      if (p >= 90) return 'A';
      if (p >= 80) return 'B';
      if (p >= 70) return 'C';
      if (p >= 60) return 'D';
      return 'F';
    };

    const getGPAScore = (p: number) => {
      if (p >= 90) return '4.0';
      if (p >= 85) return '3.7';
      if (p >= 80) return '3.3';
      if (p >= 75) return '3.0';
      if (p >= 70) return '2.7';
      if (p >= 65) return '2.3';
      if (p >= 60) return '2.0';
      return '0.0';
    };

    return {
      currentPercentage: Math.round(currentPercentage * 10) / 10,
      totalWeightUsedPercent: Math.round(totalWeightRatio * 100),
      letterGrade: getLetterGrade(currentPercentage),
      gpaScore: getGPAScore(currentPercentage),
      neededFinalPercentage: neededFinalPercentage !== null ? Math.round(neededFinalPercentage * 10) / 10 : null,
      finalsWeightPercent: Math.round(finalsWeight * 100),
      hasFinalExam,
    };
  };

  const stats = getGradeCalculations();

  return (
    <div className="space-y-6 text-white animate-fade-in p-2 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-xs border border-white/10">
            GRADES
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight font-sans">
            Grade <span className="font-sans font-extrabold text-sky-100">Calculator.</span>
          </h1>
          <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Log coursework scores and forecast semester GPA.</p>
        </div>
        
        {subjects.length > 0 && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Subject Selector */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code ? `[${s.code}] ` : ''}{s.name}</option>
              ))}
            </select>

            <button
              onClick={handleOpenAddModal}
              className="py-2.5 px-4 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.97] cursor-pointer shrink-0"
            >
              Log Score
            </button>
          </div>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 text-white shadow-xl flex items-start gap-3">
          <div>
            <h4 className="font-bold text-sm text-sky-100">Subjects Required</h4>
            <p className="text-xs text-sky-200/80 mt-0.5">Please create at least one subject in the Subject Manager before calculator operations.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List of grades */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Subject Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Weighted Average */}
              <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-5 shadow-xl flex flex-col justify-between hover:bg-white/15 transition-all">
                <span className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">weighted grade</span>
                <h4 className="text-3xl font-extrabold text-white mt-2 font-mono">{stats.currentPercentage}%</h4>
                <span className="text-[11px] text-sky-200/60 font-mono font-bold mt-2 uppercase tracking-wide">
                  {stats.totalWeightUsedPercent}% weights logged
                </span>
              </div>

              {/* Letter Grade */}
              <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-5 shadow-xl flex flex-col justify-between hover:bg-white/15 transition-all">
                <span className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">letter grade</span>
                <h4 className="text-3xl font-mono font-extrabold text-white mt-2">{stats.letterGrade}</h4>
                <span className="text-[11px] text-sky-200/60 font-mono font-bold mt-2 uppercase tracking-wide">
                  Scale: {activeSemester?.grading_system || 'GPA'}
                </span>
              </div>

              {/* GPA Score */}
              <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-5 shadow-xl flex flex-col justify-between hover:bg-white/15 transition-all">
                <span className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">gpa index</span>
                <h4 className="text-3xl font-extrabold text-white mt-2 font-mono">{stats.gpaScore}</h4>
                <span className="text-[11px] text-sky-200/60 font-mono font-bold mt-2 uppercase tracking-wide">
                  Estimated average
                </span>
              </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] shadow-xl overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70">LOGGED ASSIGNMENTS ({subjectGrades.length})</span>
              </div>

              {subjectGrades.length === 0 ? (
                <div className="p-12 text-center text-sky-200/60 text-xs font-semibold uppercase tracking-wider">
                  <span>No grade entries logged for this subject.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200/70">
                        <th className="py-3 px-6">Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Weight</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-white">
                      {subjectGrades.map((grd) => (
                        <tr key={grd.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-6 font-sans font-semibold text-white text-sm">{grd.name}</td>
                          <td className="py-3.5 px-4 font-semibold text-sky-100">
                            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded border border-white/10 bg-white/10 uppercase tracking-wider">
                              {grd.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {grd.score} / {grd.max_score}
                            <span className="text-xs text-sky-200/60 font-normal ml-1.5 font-mono">
                              ({Math.round((grd.score / grd.max_score) * 100)}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white font-mono">
                            {Math.round(grd.weight * 100)}%
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => handleOpenEditModal(grd)}
                                className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all"
                              >
                                edit
                              </button>
                              <button
                                onClick={() => handleDelete(grd.id)}
                                className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300 border-b border-rose-300/20 hover:border-rose-455 pb-0.5 transition-all"
                              >
                                remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Grade Target Predictor Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 text-white space-y-5 sticky top-6 shadow-xl">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70">Target score simulator</span>
              
              <p className="text-xs text-sky-100/90 leading-relaxed font-semibold">
                Set desired term average for {currentSubject?.name || 'subject'} and find the score needed in your Finals.
              </p>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Target Grade (%)</label>
                <div className="mt-1.5 relative rounded-2xl shadow-sm">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(parseInt(e.target.value) || 0)}
                    className="block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 font-mono font-bold text-base"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-sky-200/40 font-bold text-xs uppercase font-mono">
                    %
                  </div>
                </div>
              </div>

              {/* Calculator Output Bubble */}
              {stats.neededFinalPercentage !== null ? (
                <div className={`p-5 rounded-2xl border text-center ${
                  stats.neededFinalPercentage > 100
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-100'
                    : stats.neededFinalPercentage <= 50
                    ? 'bg-sky-500/20 border-sky-500/30 text-sky-100'
                    : 'bg-white/10 border border-white/10 text-sky-100'
                }`}>
                  {stats.neededFinalPercentage > 100 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-mono font-bold uppercase tracking-widest text-rose-350">Unreachable Target</p>
                      <p className="text-xl font-extrabold font-mono text-rose-200">Need {stats.neededFinalPercentage}%</p>
                      <p className="text-xs text-rose-200/80 font-medium">
                        You need more than 100% on the final exam weight ({stats.finalsWeightPercent}%) to hit a {targetGrade}% term average.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-mono font-bold uppercase tracking-widest text-sky-350">Final Exam Target</p>
                      <p className="text-2xl font-black font-mono text-sky-100">{stats.neededFinalPercentage}%</p>
                      <p className="text-xs text-sky-100/80 leading-normal font-medium mt-1">
                        You need <span className="font-extrabold">{stats.neededFinalPercentage}%</span> on Finals (weighted at {stats.finalsWeightPercent}%) to score {targetGrade}% overall.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center text-xs font-mono font-bold uppercase tracking-widest text-sky-200/40">
                  Log scores with weights to run simulation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Grade Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-xl text-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-mono font-bold text-white text-sm uppercase tracking-[0.18em]">
                {editingGradeId ? 'Edit Logged Score' : 'Log Grade Item'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-sky-200 hover:text-white font-mono font-bold uppercase tracking-wider text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
                >
                  <option value="quiz">Quiz</option>
                  <option value="activity">Lab / Activity</option>
                  <option value="project">Project</option>
                  <option value="midterm exam">Midterm Exam</option>
                  <option value="final exam">Final Exam</option>
                  <option value="attendance">Attendance Grade</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lab Exercise 1, Midterm Exam"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Score *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="85"
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Max Score *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    placeholder="100"
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Weight (%) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="10"
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold uppercase tracking-[0.18em] rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-white hover:bg-sky-50 text-[#6495ED] text-xs font-mono font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md active:scale-[0.97] cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
