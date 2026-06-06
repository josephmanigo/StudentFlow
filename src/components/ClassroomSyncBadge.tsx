'use client';

import React, { useState } from 'react';
import { useClassroomSync } from '@/context/ClassroomSyncContext';

interface ClassroomSyncBadgeProps {
  onReconnect?: () => void;
}

export default function ClassroomSyncBadge({ onReconnect }: ClassroomSyncBadgeProps) {
  const { isConnected, lastSynced, syncStatus, linkedCourses, syncError, isSyncing, triggerSync, disconnect } = useClassroomSync();
  const [showMenu, setShowMenu] = useState(false);

  const formatLastSynced = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Not connected and no previous link - show nothing
  if (!isConnected && syncStatus !== 'disconnected') return null;

  const statusColor = {
    idle: 'bg-emerald-400',
    syncing: 'bg-sky-400 animate-pulse',
    success: 'bg-emerald-400',
    error: 'bg-rose-400',
    disconnected: 'bg-amber-400',
  }[syncStatus] || 'bg-emerald-400';

  const statusLabel = {
    idle: isConnected ? 'Live Sync' : 'Token Expired',
    syncing: 'Syncing...',
    success: 'Synced!',
    error: 'Sync Error',
    disconnected: 'Disconnected',
  }[syncStatus] || 'Live Sync';

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(prev => !prev)}
        className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50/60 rounded-xl transition-all cursor-pointer group text-left"
      >
        <div className="relative shrink-0">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          {isSyncing && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9.5px] font-mono font-bold uppercase tracking-[0.18em] text-slate-700 truncate">
            Classroom {statusLabel}
          </p>
          {lastSynced && (
            <p className="text-[8.5px] font-mono text-slate-400 truncate mt-0.5">
              {formatLastSynced(lastSynced)}
            </p>
          )}
        </div>
        {linkedCourses.length > 0 && (
          <span className="text-[8px] font-mono font-bold bg-[#6495ED]/10 text-[#6495ED] px-1.5 py-0.5 rounded shrink-0">
            {linkedCourses.length}
          </span>
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            <div className="p-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                <p className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">
                  Google Classroom
                </p>
              </div>
              {lastSynced && (
                <p className="text-[9px] text-slate-400 mt-1 font-mono">
                  Last sync: {lastSynced.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
              {syncError && (
                <p className="text-[9px] text-rose-500 mt-1 font-mono truncate" title={syncError}>
                  Error: {syncError}
                </p>
              )}
            </div>

            {linkedCourses.length > 0 && (
              <div className="p-3 border-b border-slate-100 max-h-32 overflow-y-auto">
                <p className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Linked Courses</p>
                {linkedCourses.map((c: any) => (
                  <p key={c.id} className="text-[9.5px] font-semibold text-slate-700 truncate py-0.5">{c.name}</p>
                ))}
              </div>
            )}

            <div className="p-2 flex flex-col gap-1">
              {isConnected && (
                <button
                  onClick={() => { triggerSync(); setShowMenu(false); }}
                  disabled={isSyncing}
                  className="w-full px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-[#6495ED] hover:bg-[#6495ED]/8 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing...' : '↻ Sync Now'}
                </button>
              )}
              {!isConnected && onReconnect && (
                <button
                  onClick={() => { onReconnect(); setShowMenu(false); }}
                  className="w-full px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-left cursor-pointer"
                >
                  ↗ Reconnect
                </button>
              )}
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
              >
                ✕ Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
