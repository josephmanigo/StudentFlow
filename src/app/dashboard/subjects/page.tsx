'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

export default function SubjectsPage() {
  const {
    subjects,
    assignments,
    exams,
    grades,
    attendance,
    addSubject,
    editSubject,
    deleteSubject,
  } = useData();
  const { showToast } = useToast();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#0ea5e9');

  const colorOptions = [
    '#0ea5e9', // Sky Blue
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#14b8a6', // Teal
    '#ec4899', // Pink
  ];

  const handleOpenAddModal = () => {
    setEditingSubjId(null);
    setName('');
    setCode('');
    setInstructor('');
    setSchedule('');
    setRoom('');
    setColor(colorOptions[0]);
    setModalOpen(true);
  };

  const handleOpenEditModal = (subj: any) => {
    setEditingSubjId(subj.id);
    setName(subj.name);
    setCode(subj.code);
    setInstructor(subj.instructor_name);
    setSchedule(subj.schedule);
    setRoom(subj.room);
    setColor(subj.color || colorOptions[0]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast('Subject Name is required', 'warning');
      return;
    }

    try {
      if (editingSubjId) {
        await editSubject(editingSubjId, { name, code, instructor_name: instructor, schedule, room, color });
        showToast('Subject updated successfully!');
      } else {
        await addSubject({ name, code, instructor_name: instructor, schedule, room, color });
        showToast('Subject created successfully!');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving subject', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject? All linked assignments, grades, and attendance will be deleted.')) {
      try {
        await deleteSubject(id);
        showToast('Subject deleted successfully', 'success');
        if (selectedSubjectId === id) {
          setSelectedSubjectId(null);
        }
      } catch (err: any) {
        showToast(err.message || 'Error deleting subject', 'error');
      }
    }
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Derive stats for a subject
  const getSubjectStats = (subjId: string) => {
    const subjAss = assignments.filter(a => a.subject_id === subjId);
    const pendingAss = subjAss.filter(a => a.status !== 'submitted').length;
    
    const subjEx = exams.filter(e => e.subject_id === subjId);
    
    const subjAtt = attendance.filter(a => a.subject_id === subjId);
    const present = subjAtt.filter(a => a.status === 'present').length;
    const late = subjAtt.filter(a => a.status === 'late').length;
    const totalAtt = subjAtt.length;
    const attPercent = totalAtt > 0 ? Math.round(((present + late) / totalAtt) * 100) : 100;

    const subjGrds = grades.filter(g => g.subject_id === subjId);
    let currentGrade = 0;
    let totalWeight = 0;
    subjGrds.forEach(g => {
      currentGrade += (g.score / g.max_score) * g.weight;
      totalWeight += g.weight;
    });
    const average = totalWeight > 0 ? Math.round((currentGrade / totalWeight) * 100) : null;

    return {
      assignmentsCount: subjAss.length,
      pendingAssignments: pendingAss,
      examsCount: subjEx.length,
      attendancePercentage: attPercent,
      averageGrade: average,
    };
  };

  return (
    <div className="space-y-6 text-white animate-fade-in p-2 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-[10px] border border-white/10">
            COURSES
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight font-sans">
            Subject <span className="font-sans font-extrabold text-sky-100">Manager.</span>
          </h1>
          <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Configure your course schedules.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="py-2.5 px-4.5 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-[11px] uppercase tracking-[0.18em] transition-all shadow-md active:scale-[0.97] cursor-pointer self-start sm:self-auto"
        >
          Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-12 text-center max-w-xl mx-auto text-white shadow-xl">
          <h3 className="text-base font-bold font-sans">No subjects created</h3>
          <p className="text-sky-200/60 text-sm font-medium mt-1">Get started by creating your first university course list.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 py-2.5 px-5 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-[11px] uppercase tracking-[0.18em] transition-all shadow-md active:scale-[0.97] cursor-pointer"
          >
            Create Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subjects Cards List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subj) => {
                const stats = getSubjectStats(subj.id);
                const isSelected = selectedSubjectId === subj.id;

                return (
                  <div
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-5 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden group hover:bg-white/15 hover:border-white/25 transition-all duration-300 ${
                      isSelected
                        ? 'ring-2 ring-white/30 border-white/40 bg-white/20 shadow-[0_8px_32px_0_rgba(255,255,255,0.05)]'
                        : ''
                    }`}
                  >
                    {/* Left Accent Color bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2.5"
                      style={{ backgroundColor: subj.color }}
                    />

                    <div className="pl-3.5 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold font-mono text-sky-200/60 uppercase tracking-widest">
                          {subj.code || 'course'}
                        </span>
                        
                        <div className={`flex items-center gap-2.5 transition-opacity duration-200 ${
                          isSelected ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(subj);
                            }}
                            className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all"
                          >
                            edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(subj.id);
                            }}
                            className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300 border-b border-rose-300/20 hover:border-rose-400 pb-0.5 transition-all"
                          >
                            remove
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-sans font-bold text-white text-lg mt-1 truncate">
                        {subj.name}
                      </h3>
                      
                      {subj.instructor_name && (
                        <p className="text-xs text-sky-100/80 truncate font-semibold">
                          Instructor: {subj.instructor_name}
                        </p>
                      )}
                    </div>

                    {/* Stats Summary Footer */}
                    <div className="pl-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-sky-200/60 uppercase tracking-widest font-mono">Average</p>
                        <p className="text-sm font-bold text-white mt-0.5 font-mono">
                          {stats.averageGrade !== null ? `${stats.averageGrade}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-sky-200/60 uppercase tracking-widest font-mono">Tasks</p>
                        <p className="text-sm font-bold text-white mt-0.5 font-mono">
                          {stats.pendingAssignments}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-sky-200/60 uppercase tracking-widest font-mono">Attended</p>
                        <p className={`text-sm font-bold mt-0.5 font-mono ${stats.attendancePercentage < 75 ? 'text-rose-300' : 'text-white'}`}>
                          {stats.attendancePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject Detail View Panel */}
          <div className="lg:col-span-1">
            {selectedSubject ? (
              <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 text-white space-y-5 sticky top-6 shadow-xl">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded text-white font-mono uppercase tracking-widest border border-white/15"
                      style={{ backgroundColor: selectedSubject.color }}
                    >
                      {selectedSubject.code || 'course'}
                    </span>
                    <h2 className="text-2xl font-extrabold text-white mt-2 leading-tight truncate">{selectedSubject.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedSubjectId(null)}
                    className="text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200 hover:text-white border-b border-transparent hover:border-white transition-all shrink-0 cursor-pointer"
                  >
                    dismiss
                  </button>
                </div>

                {/* Course Metadata */}
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl text-sm text-white border border-white/10">
                  {selectedSubject.instructor_name && (
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-200/50 block mb-0.5">instructor</span>
                      <p className="font-sans font-semibold text-base text-sky-100/90 truncate">{selectedSubject.instructor_name}</p>
                    </div>
                  )}
                  {selectedSubject.schedule && (
                    <div className="mt-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-200/50 block mb-0.5">schedule</span>
                      <p className="font-sans font-semibold text-base text-sky-100/90 truncate">{selectedSubject.schedule}</p>
                    </div>
                  )}
                  {selectedSubject.room && (
                    <div className="mt-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-200/50 block mb-0.5">location</span>
                      <p className="font-sans font-semibold text-base text-sky-100/90 truncate">{selectedSubject.room}</p>
                    </div>
                  )}
                </div>

                {/* Connected lists */}
                <div className="space-y-3.5 pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-sky-200/50 font-mono">WORKSPACE LOGS</h4>
                  
                  {/* Linked Assignments */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-white/10">
                    <span className="font-bold text-sky-100/85">Assignments</span>
                    <span className="font-mono text-sky-200/70 font-bold">
                      {assignments.filter(a => a.subject_id === selectedSubject.id).length} items
                    </span>
                  </div>

                  {/* Linked Exams */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-white/10">
                    <span className="font-bold text-sky-100/85">Exams Scheduled</span>
                    <span className="font-mono text-sky-200/70 font-bold">
                      {exams.filter(e => e.subject_id === selectedSubject.id).length} items
                    </span>
                  </div>

                  {/* Grades category */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-white/10">
                    <span className="font-bold text-sky-100/85">Grade Items</span>
                    <span className="font-mono text-sky-200/70 font-bold">
                      {grades.filter(g => g.subject_id === selectedSubject.id).length} logs
                    </span>
                  </div>

                  {/* Attendance log count */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-white/10">
                    <span className="font-bold text-sky-100/85">Attendance Log</span>
                    <span className="font-mono text-sky-200/70 font-bold">
                      {attendance.filter(a => a.subject_id === selectedSubject.id).length} classes
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] font-mono font-bold text-sky-200/40 uppercase tracking-widest text-center">
                  Use side modules to configure detailed items
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-dashed border-white/15 rounded-[32px] p-8 text-center text-sky-200/50 text-sm font-semibold h-44 flex flex-col justify-center items-center">
                <span>Select a subject card to load overview summaries.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-xl text-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-mono font-bold text-white text-xs uppercase tracking-[0.18em]">
                {editingSubjId ? 'Edit Subject Details' : 'Create New Subject'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-sky-200 hover:text-white font-mono font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Calculus II"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Subject Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MATH 201"
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Instructor</label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="e.g. Prof. Newton"
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Class Schedule</label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="e.g. Tue/Thu 11:00 AM"
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Room / Location</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Science Hall 104"
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70 mb-2.5">Color Label</label>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setColor(clr)}
                      className={`w-6.5 h-6.5 rounded-full cursor-pointer border-2 transition-transform ${
                        color === clr ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-[9px] font-mono font-bold uppercase tracking-[0.18em] rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-white hover:bg-sky-50 text-[#6495ED] text-[9px] font-mono font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md active:scale-[0.97] cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
