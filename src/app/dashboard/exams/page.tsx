'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

export default function ExamsPage() {
  const {
    subjects,
    exams,
    addExam,
    editExam,
    deleteExam,
  } = useData();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form Fields
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [topics, setTopics] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  const handleOpenAddModal = () => {
    setEditingExamId(null);
    setSubjectId(subjects[0]?.id || '');
    setTitle('');
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    defaultDate.setHours(9, 0, 0, 0);
    setExamDate(defaultDate.toISOString().slice(0, 16));
    setTopics('');
    setReminderDate('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (exm: any) => {
    setEditingExamId(exm.id);
    setSubjectId(exm.subject_id);
    setTitle(exm.title);
    setExamDate(new Date(exm.exam_date).toISOString().slice(0, 16));
    setTopics(exm.topics || '');
    setReminderDate(exm.reminder_date ? new Date(exm.reminder_date).toISOString().slice(0, 16) : '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !examDate) {
      showToast('Please fill in Title, Subject, and Exam Date', 'warning');
      return;
    }

    const payload = {
      subject_id: subjectId,
      title,
      exam_date: new Date(examDate).toISOString(),
      topics,
      reminder_date: reminderDate ? new Date(reminderDate).toISOString() : undefined,
    };

    try {
      if (editingExamId) {
        await editExam(editingExamId, payload);
        showToast('Exam updated successfully!');
      } else {
        await addExam(payload);
        showToast('Exam scheduled successfully!');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving exam', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this exam?')) {
      try {
        await deleteExam(id);
        showToast('Exam deleted', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error deleting exam', 'error');
      }
    }
  };

  const getSubjectColor = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? subj.color : '#0ea5e9';
  };

  const getSubjectCode = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? subj.code : 'EXAM';
  };

  const getSubjectName = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? subj.name : '';
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    const examDateVal = new Date(dateStr);
    const diffTime = examDateVal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCountdownBadgeColor = (days: number) => {
    if (days < 0) return 'bg-white/10 border-white/10 text-sky-200/60';
    if (days <= 2) return 'bg-rose-500/20 border-rose-500/30 text-rose-200 font-bold';
    if (days <= 5) return 'bg-amber-500/20 border-amber-500/30 text-amber-200 font-bold';
    return 'bg-white/10 border-white/10 text-white font-bold';
  };

  const today = new Date();
  const upcomingExams = exams
    .filter(e => new Date(e.exam_date) >= today)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
  
  const pastExams = exams
    .filter(e => new Date(e.exam_date) < today)
    .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());

  const formatExamDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 text-white animate-fade-in p-2 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-xs border border-white/10">
            TESTS
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight font-sans">
            Exam <span className="font-sans font-extrabold text-sky-100">Countdown.</span>
          </h1>
          <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Monitor countdowns and review subjects.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={subjects.length === 0}
          className="py-2.5 px-4.5 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.97] disabled:opacity-40 self-start sm:self-auto cursor-pointer"
        >
          Schedule Exam
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 text-white shadow-xl flex items-start gap-3">
          <div>
            <h4 className="font-bold text-sm text-sky-100">Subjects Required</h4>
            <p className="text-xs text-sky-200/80 mt-0.5">Please create at least one subject in the Subject Manager before scheduling exams.</p>
          </div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-12 text-center max-w-xl mx-auto text-white shadow-xl">
          <h3 className="text-base font-bold font-sans">No scheduled exams</h3>
          <p className="text-sky-200/60 text-xs font-medium mt-1">Keep track of quizzes, midterms, and finals in this dashboard.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 py-2.5 px-4 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-[9px] uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.97] cursor-pointer"
          >
            Schedule First Exam
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Countdowns Grid */}
          {upcomingExams.length > 0 && (
            <div className="space-y-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70">UPCOMING EXAMS ({upcomingExams.length})</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingExams.map((exm) => {
                  const days = getDaysRemaining(exm.exam_date);

                  return (
                    <div
                      key={exm.id}
                      className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-5 shadow-xl relative overflow-hidden group flex flex-col justify-between h-52 hover:bg-white/15 hover:border-white/25 transition-all duration-300"
                    >
                      {/* Accent top color band */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: getSubjectColor(exm.subject_id) }}
                      />

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider border border-white/10"
                            style={{ backgroundColor: getSubjectColor(exm.subject_id) }}
                          >
                            {getSubjectCode(exm.subject_id)}
                          </span>

                          <div className="flex items-center gap-2.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(exm)}
                              className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all"
                            >
                              edit
                            </button>
                            <button
                              onClick={() => handleDelete(exm.id)}
                              className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300 border-b border-rose-300/20 hover:border-rose-455 pb-0.5 transition-all"
                            >
                              remove
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-base mt-1 truncate">
                            {exm.title}
                          </h3>
                          <p className="text-[11px] text-sky-200/60 font-mono font-bold uppercase tracking-wide truncate mt-0.5">
                            {getSubjectName(exm.subject_id)}
                          </p>
                        </div>

                        {exm.topics && (
                          <div className="pt-1.5">
                            <span className="text-xs font-mono font-bold text-sky-200/50 uppercase tracking-widest block">Review Topics</span>
                            <p className="text-xs text-sky-100/90 font-medium line-clamp-2 mt-0.5">{exm.topics}</p>
                          </div>
                        )}
                      </div>

                      {/* Countdown Footer Ticker */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-mono font-bold text-sky-200/60 uppercase tracking-widest truncate">{formatExamDate(exm.exam_date)}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border uppercase shrink-0 tracking-wider ${getCountdownBadgeColor(days)}`}>
                          {days === 0 ? 'Today' : days === 1 ? '1 day left' : `${days} days left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Exams Section */}
          {pastExams.length > 0 && (
            <div className="space-y-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70">COMPLETED EXAMS ({pastExams.length})</span>
              
              <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] shadow-xl overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200/70">
                        <th className="py-3 px-6">Exam Title</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Exam Date</th>
                        <th className="py-3 px-4">Topics</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-white">
                      {pastExams.map((exm) => (
                        <tr key={exm.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-white text-sm">{exm.title}</td>
                          <td className="py-3.5 px-4 font-semibold text-sky-100">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getSubjectColor(exm.subject_id) }} />
                              <span>{getSubjectCode(exm.subject_id)}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-sky-200/60">{formatExamDate(exm.exam_date)}</td>
                          <td className="py-3.5 px-4 font-medium max-w-xs truncate text-sky-100/90">{exm.topics || 'None logged'}</td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => handleOpenEditModal(exm)}
                                className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all"
                              >
                                edit
                              </button>
                              <button
                                onClick={() => handleDelete(exm.id)}
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-xl text-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-mono font-bold text-white text-sm uppercase tracking-[0.18em]">
                {editingExamId ? 'Modify Scheduled Exam' : 'Schedule Academic Exam'}
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
                <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Subject *</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
                >
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.code ? `[${subj.code}] ` : ''}{subj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Exam Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Coding Assessment"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Review Topics</label>
                <textarea
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="Review chapters, concepts, study lists..."
                  rows={3}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Exam Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Reminder Alarm</label>
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
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
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
