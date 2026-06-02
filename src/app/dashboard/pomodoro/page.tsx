'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

export default function PomodoroPage() {
  const { pomodoroSessions, addPomodoroSession } = useData();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [isActive, setIsActive] = useState(false);
  
  // Times in seconds
  const STUDY_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playChime = (delay: number, pitch: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.8);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.8);
      };
      
      playChime(0, 523.25); // C5
      playChime(0.25, 659.25); // E5
      playChime(0.5, 783.99); // G5
    } catch (e) {
      console.warn('Web Audio API blocked or not supported');
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    playAlertSound();

    const completedDuration = mode === 'study' ? 25 : 5;
    
    try {
      await addPomodoroSession(completedDuration, mode);
      showToast(
        mode === 'study'
          ? 'Focus session complete. Take a short break.'
          : 'Break complete. Ready to study again?',
        'success'
      );
      
      const nextMode = mode === 'study' ? 'break' : 'study';
      setMode(nextMode);
      setTimeLeft(nextMode === 'study' ? STUDY_TIME : BREAK_TIME);
    } catch (err) {
      showToast('Error saving completed session', 'error');
    }
  };

  const handleToggleActive = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? STUDY_TIME : BREAK_TIME);
  };

  const handleModeChange = (newMode: 'study' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'study' ? STUDY_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const studySessions = pomodoroSessions.filter(s => s.type === 'study');
  const breakSessions = pomodoroSessions.filter(s => s.type === 'break');
  const totalStudyMinutes = studySessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalBreakMinutes = breakSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  // Compute circular ring offset percentage
  const totalDuration = mode === 'study' ? STUDY_TIME : BREAK_TIME;
  const progressRatio = timeLeft / totalDuration;
  const strokeDashoffset = 2 * Math.PI * 90 * (1 - progressRatio);

  return (
    <div className="space-y-6 text-white animate-fade-in p-2 md:p-4">
      <div className="space-y-1.5">
        <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-xs border border-white/10">
          CHRONO
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-tight font-sans">
          Focus <span className="font-sans font-extrabold text-sky-100">Timer.</span>
        </h1>
        <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Set structured study intervals to focus.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pomodoro Clock Face */}
        <div className="lg:col-span-2 bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-8 flex flex-col items-center justify-center shadow-xl min-h-[400px] text-white">
          {/* Mode Selector Buttons */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-8">
            <button
              onClick={() => handleModeChange('study')}
              className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'study'
                  ? 'bg-white text-[#6495ED] shadow-md'
                  : 'text-sky-200 hover:text-white'
              }`}
            >
              Study Session
            </button>
            <button
              onClick={() => handleModeChange('break')}
              className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'break'
                  ? 'bg-white text-[#6495ED] shadow-md'
                  : 'text-sky-200 hover:text-white'
              }`}
            >
              Short Break
            </button>
          </div>

          {/* Circular Countdown Ring */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <svg className="w-56 h-56 transform -rotate-90">
              <circle
                className="text-white/10"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="90"
                cx="112"
                cy="112"
              />
              <circle
                className="text-white"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="90"
                cx="112"
                cy="112"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-sky-200/50 font-mono font-bold uppercase tracking-widest mt-1.5">
                {isActive ? 'FOCUSING' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Clock controls */}
          <div className="flex gap-4">
            <button
              onClick={handleToggleActive}
              className="py-3 px-6 bg-white hover:bg-sky-50 text-[#6495ED] text-xs font-mono font-bold uppercase tracking-[0.18em] rounded-xl transition-all shadow-md active:scale-[0.97] cursor-pointer"
            >
              {isActive ? 'Pause Session' : 'Start Focus'}
            </button>

            <button
              onClick={handleReset}
              className="py-3 px-6 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold uppercase tracking-[0.18em] rounded-xl transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Focus Analytics & Logs */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Stats Summary Panel */}
          <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-xl space-y-5 text-white">
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70 block">Focus analytics</span>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">completed</p>
                <p className="text-2xl font-extrabold text-white mt-1 font-mono">{studySessions.length}</p>
                <p className="text-xs text-sky-200/40 mt-1 uppercase font-bold tracking-widest font-mono">sessions</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-xs font-mono font-bold text-sky-200/60 uppercase tracking-widest">focus time</p>
                <p className="text-2xl font-extrabold text-white mt-1 font-mono">{totalStudyMinutes}m</p>
                <p className="text-xs text-sky-200/40 mt-1 uppercase font-bold tracking-widest font-mono">minutes</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-sky-100">
              <span className="font-semibold text-sky-200/70 uppercase tracking-wide text-xs font-mono">Total Break Duration</span>
              <span className="font-mono font-bold text-white">{totalBreakMinutes} minutes</span>
            </div>
          </div>

          {/* Recent Completed List */}
          <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-xl space-y-4 text-white">
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70 block">Recent Activity Log</span>
            
            {pomodoroSessions.length === 0 ? (
              <div className="text-center py-6 text-xs text-sky-200/50 font-mono font-bold uppercase tracking-wider">
                No sessions completed yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {pomodoroSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-sans font-bold text-white text-xs capitalize">
                        {session.type} session
                      </p>
                      <p className="text-xs text-sky-200/50 font-mono mt-0.5">
                        Completed at {new Date(session.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="font-bold text-white font-mono shrink-0">
                      +{session.duration_minutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
