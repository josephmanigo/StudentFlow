'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useClassroomSync } from '@/context/ClassroomSyncContext';

export default function AssignmentsPage() {
  const {
    subjects,
    assignments,
    addAssignment,
    editAssignment,
    deleteAssignment,
  } = useData();
  const { showToast } = useToast();
  const { isConnected, lastSynced, isSyncing, triggerSync, syncStatus } = useClassroomSync();

  // View toggles: 'kanban' or 'list'
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters state
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignId, setEditingAssignId] = useState<string | null>(null);

  // Form Fields
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'not started' | 'in progress' | 'submitted'>('not started');
  const [reminderDate, setReminderDate] = useState('');

  const handleOpenAddModal = () => {
    setEditingAssignId(null);
    setSubjectId(subjects[0]?.id || '');
    setTitle('');
    setDescription('');
    const defaultDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    defaultDeadline.setHours(23, 59, 0, 0);
    setDeadline(defaultDeadline.toISOString().slice(0, 16));
    setPriority('medium');
    setStatus('not started');
    setReminderDate('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (assign: any) => {
    setEditingAssignId(assign.id);
    setSubjectId(assign.subject_id);
    setTitle(assign.title);
    setDescription(assign.description || '');
    setDeadline(new Date(assign.deadline).toISOString().slice(0, 16));
    setPriority(assign.priority);
    setStatus(assign.status);
    setReminderDate(assign.reminder_date ? new Date(assign.reminder_date).toISOString().slice(0, 16) : '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !deadline) {
      showToast('Please fill in required fields (Title, Subject, Deadline)', 'warning');
      return;
    }

    const payload = {
      subject_id: subjectId,
      title,
      description,
      deadline: new Date(deadline).toISOString(),
      priority,
      status,
      reminder_date: reminderDate ? new Date(reminderDate).toISOString() : undefined,
    };

    try {
      if (editingAssignId) {
        await editAssignment(editingAssignId, payload);
        showToast('Assignment updated successfully!');
      } else {
        await addAssignment(payload);
        showToast('Assignment added successfully!');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving assignment', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this assignment?')) {
      try {
        await deleteAssignment(id);
        showToast('Assignment removed', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error deleting assignment', 'error');
      }
    }
  };

  const handleToggleStatus = async (assign: any) => {
    const nextStatus = 
      assign.status === 'not started' ? 'in progress' : 
      assign.status === 'in progress' ? 'submitted' : 'not started';
    
    try {
      await editAssignment(assign.id, { status: nextStatus });
      showToast(`Updated status to: ${nextStatus}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Filtered Assignments
  const filteredAssignments = assignments.filter((assign) => {
    const matchesSubject = filterSubject === 'all' || assign.subject_id === filterSubject;
    const matchesPriority = filterPriority === 'all' || assign.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || assign.status === filterStatus;
    return matchesSubject && matchesPriority && matchesStatus;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-500/20 border-rose-500/30 text-rose-200';
      case 'medium': return 'bg-amber-500/20 border-amber-500/30 text-amber-200';
      default: return 'bg-white/10 border-white/10 text-sky-200';
    }
  };

  const getSubjectColor = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? subj.color : '#0ea5e9';
  };

  const getSubjectName = (subjId: string) => {
    const subj = subjects.find(s => s.id === subjId);
    return subj ? `${subj.code || ''} ${subj.name}`.trim() : 'Unknown Subject';
  };

  const formatDeadline = (isoStr: string) => {
    const date = new Date(isoStr);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isOverdue = (assign: any) => {
    return assign.status !== 'submitted' && new Date(assign.deadline) < new Date();
  };

  // Render Kanban Columns
  const renderKanban = () => {
    const columns = [
      { id: 'not started', name: 'NOT STARTED', headerBg: 'bg-sky-500/25 border-b border-sky-400/30', labelColor: 'text-sky-200', accentBar: 'bg-sky-400', countBg: 'bg-sky-400/30 text-sky-100 border-sky-400/40' },
      { id: 'in progress', name: 'IN PROGRESS', headerBg: 'bg-amber-500/25 border-b border-amber-400/30', labelColor: 'text-amber-200', accentBar: 'bg-amber-400', countBg: 'bg-amber-400/30 text-amber-100 border-amber-400/40' },
      { id: 'submitted', name: 'SUBMITTED', headerBg: 'bg-emerald-500/25 border-b border-emerald-400/30', labelColor: 'text-emerald-200', accentBar: 'bg-emerald-400', countBg: 'bg-emerald-400/30 text-emerald-100 border-emerald-400/40' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = filteredAssignments.filter((a) => a.status === col.id);
          
          return (
            <div key={col.id} className="flex flex-col min-h-[400px] bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 shadow-xl overflow-hidden">
              {/* Column Header */}
              <div className={`${col.headerBg} px-5 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${col.accentBar} shadow-lg`} />
                  <span className={`text-[12px] font-mono font-bold ${col.labelColor} tracking-[0.18em] uppercase`}>{col.name}</span>
                </div>
                <span className={`px-2.5 py-1 text-[12px] font-mono font-bold border rounded-full ${col.countBg}`}>
                  {colTasks.length}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">

              {/* Tasks List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-20 flex items-center justify-center text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200/40 border border-dashed border-white/15 rounded-2xl">
                    empty list
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border border-white/10 rounded-2xl shadow-md hover:shadow-xl hover:bg-white/10 transition-all bg-white/5 relative group ${
                        isOverdue(task) ? 'border-l-2 border-l-rose-400' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span
                          className="text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded tracking-wide uppercase border border-white/10"
                          style={{ backgroundColor: getSubjectColor(task.subject_id) }}
                        >
                          {subjects.find(s => s.id === task.subject_id)?.code || 'Course'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {task.google_classroom_id && (
                            <span className="text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded tracking-widest uppercase shrink-0">
                              GC
                            </span>
                          )}
                          <div className="flex items-center gap-2.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleStatus(task)}
                            className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-250 border-b border-sky-250/20 hover:border-sky-100 pb-0.5 transition-all cursor-pointer"
                          >
                            cycle
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all cursor-pointer"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300 border-b border-rose-300/20 hover:border-rose-400 pb-0.5 transition-all cursor-pointer"
                          >
                            remove
                          </button>
                          </div>
                        </div>
                      </div>

                      <h4 className="font-sans font-bold text-white text-base tracking-tight leading-snug">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs font-medium text-sky-100/70 mt-1 line-clamp-2">{task.description}</p>
                      )}

                      {/* Footer Info */}
                      <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold font-mono ${isOverdue(task) ? 'text-rose-300' : 'text-sky-200/80'}`}>
                          Due: {formatDeadline(task.deadline)}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Table / List view
  const renderList = () => {
    return (
      <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] shadow-xl overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200/70">
                <th className="py-3.5 px-6">Assignment</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Deadline</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sky-200/60 font-semibold uppercase tracking-wider text-[12px]">
                    No items match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((task) => (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-sans font-semibold text-white text-base">{task.title}</p>
                      {task.description && <p className="text-xs text-sky-200/60 line-clamp-1 mt-0.5 font-medium">{task.description}</p>}
                    </td>
                    <td className="py-4 px-4 font-semibold text-sky-100">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSubjectColor(task.subject_id) }} />
                        <span>{getSubjectName(task.subject_id)}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-mono font-bold text-[12px] ${isOverdue(task) ? 'text-rose-300' : 'text-sky-200/80'}`}>
                        {formatDeadline(task.deadline)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all border cursor-pointer uppercase tracking-wider bg-white/10 border-white/10 text-white hover:bg-white/15"
                      >
                        <span>{task.status}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="text-[11px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/20 hover:border-white pb-0.5 transition-all"
                        >
                          edit
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300 border-b border-rose-300/20 hover:border-rose-400 pb-0.5 transition-all"
                        >
                          remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white animate-fade-in p-2 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-[10px] border border-white/10">
            TASKS
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight font-sans">
            Assignment <span className="font-sans font-extrabold text-sky-100">Tracker.</span>
          </h1>
          <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Organize schedules and submission states.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Classroom Live Sync Indicator */}
          {isConnected && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              title={lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : 'Sync with Google Classroom'}
              className={`flex items-center gap-1.5 py-2 px-3 border rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                syncStatus === 'syncing'
                  ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
                  : syncStatus === 'success'
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-white/15 bg-white/5 text-sky-200 hover:bg-white/10'
              } disabled:opacity-60`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                isSyncing ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400'
              }`} />
              {isSyncing ? 'Syncing...' : 'Live'}
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            disabled={subjects.length === 0}
            className="py-2.5 px-4.5 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-[11px] uppercase tracking-[0.18em] transition-all shadow-md active:scale-[0.97] disabled:opacity-40 cursor-pointer"
          >
            New Assignment
          </button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 text-white shadow-xl flex items-start gap-3">
          <div>
            <h4 className="font-bold text-base text-sky-100">Subjects Required</h4>
            <p className="text-sm text-sky-200/80 mt-0.5">Please create at least one subject in the Subject Manager before scheduling assignments.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controls and Filters bar */}
          <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
            {/* Left Filter Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[9px] font-bold text-sky-200/60 uppercase tracking-widest font-mono">Filter:</span>
              
              {/* Subject Filter */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
              >
                <option value="all">ALL SUBJECTS</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code || s.name}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
              >
                <option value="all">ALL PRIORITIES</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
              >
                <option value="all">ALL STATUSES</option>
                <option value="not started">NOT STARTED</option>
                <option value="in progress">IN PROGRESS</option>
                <option value="submitted">SUBMITTED</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 shrink-0 self-end md:self-auto">
              <button
                onClick={() => setViewMode('kanban')}
                className={`py-1.5 px-3 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-[#6495ED] shadow-md' : 'text-sky-200 hover:text-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`py-1.5 px-3 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  viewMode === 'list' ? 'bg-white text-[#6495ED] shadow-md' : 'text-sky-200 hover:text-white'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {/* Core Grid */}
          {assignments.length === 0 ? (
            <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-12 text-center max-w-xl mx-auto text-white shadow-xl">
              <h3 className="text-base font-bold font-sans">No assignments logged</h3>
              <p className="text-sky-200/60 text-xs font-medium mt-1">Keep track of homework deadlines and essays in this board.</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-5 py-2.5 px-4 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-[9px] uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.97] cursor-pointer"
              >
                Add Assignment
              </button>
            </div>
          ) : (
            viewMode === 'kanban' ? renderKanban() : renderList()
          )}
        </>
      )}

      {/* Add / Edit Assignment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-xl text-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-mono font-bold text-white text-xs uppercase tracking-[0.18em]">
                {editingAssignId ? 'Modify Assignment Task' : 'Log Assignment Task'}
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
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Related Subject *</label>
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
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Problem Set 5"
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Guidance, guidelines, references..."
                  rows={3}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Reminder Alarm</label>
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/70">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
                  >
                    <option value="not started">Not Started</option>
                    <option value="in progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                  </select>
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
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
