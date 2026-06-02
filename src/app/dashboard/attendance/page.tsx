'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

export default function AttendancePage() {
  const {
    subjects,
    attendance,
    addAttendance,
    editAttendance,
    deleteAttendance,
  } = useData();
  const { showToast } = useToast();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  
  // Quick Log Fields
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logStatus, setLogStatus] = useState<'present' | 'absent' | 'late'>('present');

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !logDate) {
      showToast('Please select a subject and date', 'warning');
      return;
    }

    const subjectLogs = attendance.filter(a => a.subject_id === selectedSubjectId);
    const dateExists = subjectLogs.some(a => a.date === logDate);
    if (dateExists) {
      showToast('Attendance is already logged for this subject on this date. Update the status in the list below.', 'warning');
      return;
    }

    try {
      await addAttendance({
        subject_id: selectedSubjectId,
        date: logDate,
        status: logStatus,
      });
      showToast('Attendance logged successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error logging attendance', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'present' | 'absent' | 'late') => {
    const nextStatusMap: Record<string, 'present' | 'absent' | 'late'> = {
      'present': 'late',
      'late': 'absent',
      'absent': 'present'
    };
    const nextStatus = nextStatusMap[currentStatus];

    try {
      await editAttendance(id, { status: nextStatus });
      showToast(`Status updated to ${nextStatus}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this attendance record?')) {
      try {
        await deleteAttendance(id);
        showToast('Record deleted', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error deleting record', 'error');
      }
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const subjectLogs = attendance
    .filter(a => a.subject_id === selectedSubjectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Attendance metrics
  const totalLogs = subjectLogs.length;
  const presentCount = subjectLogs.filter(a => a.status === 'present').length;
  const lateCount = subjectLogs.filter(a => a.status === 'late').length;
  const absentCount = subjectLogs.filter(a => a.status === 'absent').length;
  
  const attendanceRate = totalLogs > 0 ? Math.round(((presentCount + lateCount) / totalLogs) * 100) : 100;
  const lowAttendance = attendanceRate < 75;

  return (
    <div className="space-y-6 text-white animate-fade-in p-2 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-xs border border-white/10">
            PRESENCE
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight font-sans">
            Attendance <span className="font-sans font-extrabold text-sky-100">Tracker.</span>
          </h1>
          <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Log session rates and monitor attendance averages.</p>
        </div>

        {subjects.length > 0 && (
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer self-start sm:self-auto [&>option]:bg-[#6495ED] [&>option]:text-white"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code ? `[${s.code}] ` : ''}{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 text-white shadow-xl flex items-start gap-3">
          <div>
            <h4 className="font-bold text-sm text-sky-100">Subjects Required</h4>
            <p className="text-xs text-sky-200/80 mt-0.5">Please create at least one subject in the Subject Manager before tracking attendance.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main logs & quick add */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Log Form */}
            <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-5 shadow-xl">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70">Quick Log Entry</span>
              <form onSubmit={handleAddLog} className="flex flex-col sm:flex-row items-end gap-4 mt-3">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-sky-200/60">Class Date</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold"
                  />
                </div>

                <div className="w-full sm:w-44">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-sky-200/60">Status</label>
                  <select
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs font-semibold cursor-pointer [&>option]:bg-[#6495ED] [&>option]:text-white"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto py-2.5 px-5 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.97] cursor-pointer shrink-0"
                >
                  Log Entry
                </button>
              </form>
            </div>

            {/* Attendance Logs List */}
            <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] shadow-xl overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70">attendance log list</span>
                <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-white/10 border border-white/10 text-white rounded-full">
                  {totalLogs} sessions
                </span>
              </div>

              {totalLogs === 0 ? (
                <div className="p-12 text-center text-sky-200/60 text-xs font-semibold uppercase tracking-wider">
                  <span>No logs entered for this subject.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[11px] font-mono font-bold uppercase tracking-widest text-sky-200/70">
                        <th className="py-3 px-6">Class Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-white">
                      {subjectLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-6 font-sans font-semibold text-white text-sm">
                            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStatus(log.id, log.status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all border cursor-pointer capitalize ${
                                log.status === 'present'
                                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-250'
                                  : log.status === 'late'
                                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-250'
                                  : 'bg-rose-500/20 border-rose-500/30 text-rose-250'
                              }`}
                              title="Click to toggle status"
                            >
                              <span>{log.status}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300 border-b border-rose-300/20 hover:border-rose-455 pb-0.5 transition-all cursor-pointer"
                            >
                              remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Stats & Warnings Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Metric Panel */}
            <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 text-center space-y-5 shadow-xl text-white">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70 block text-left">Summary statistics</span>
              
              <div className="py-6">
                <span className="text-4xl font-extrabold font-mono text-white">{attendanceRate}%</span>
                <p className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest mt-1">Attendance Rate</p>
              </div>

              {/* Warnings */}
              {lowAttendance && totalLogs > 0 ? (
                <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-100 text-left">
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-rose-300">Attendance Warning</p>
                  <p className="text-xs font-semibold text-sky-100/90 mt-1 leading-normal">
                    Your attendance rate is currently below 75%. Try not to miss future sessions to prevent academic penalties.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-sky-500/20 border border-sky-500/30 rounded-2xl text-sky-100 text-left">
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-sky-350">Attendance Good</p>
                  <p className="text-xs font-semibold text-sky-100/95 mt-1 leading-normal">
                    Your attendance is above the 75% college minimum standard. Keep it up!
                  </p>
                </div>
              )}

              {/* Counters List */}
              <div className="grid grid-cols-3 divide-x divide-white/10 text-center pt-2">
                <div>
                  <p className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">Present</p>
                  <p className="text-base font-extrabold text-white mt-1 font-mono">{presentCount}</p>
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">Late</p>
                  <p className="text-base font-extrabold text-white mt-1 font-mono">{lateCount}</p>
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">Absent</p>
                  <p className="text-base font-extrabold text-rose-300 mt-1 font-mono">{absentCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
