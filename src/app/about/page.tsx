'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#6495ED] text-white flex flex-col relative font-sans">
      {/* Decorative Glow Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[120px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="w-full px-8 md:px-16 py-4 flex items-center justify-between z-10 bg-[#6495ED]/80 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="flex items-center gap-1.5">
          <img
            src="/studentflow_logo.png"
            alt="StudentFlow Logo"
            width={64}
            height={64}
            className="w-16 h-16 object-contain shrink-0"
          />
          <span className="font-black text-2xl tracking-tighter font-sans uppercase">StudentFlow</span>
        </Link>

        {/* Back Link */}
        <Link href="/" className="text-xs font-bold uppercase tracking-widest text-white/90 hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </header>

      {/* Page Body */}
      <main className="flex-1 w-full px-8 md:px-16 py-16 z-10 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal italic text-white tracking-tight leading-tight">
              Built by Student,<br />For Students.
            </h1>
            
            <p className="text-sky-50 text-sm sm:text-base md:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
              StudentFlow started as a side project when the idea randomly popped into my head to build a single, unified workspace to track assignments, absences, exams, and everything else in college life. Created to eliminate the clutter of traditional planning tools, it&apos;s designed to keep you focused entirely on your academic flow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-white/20 max-w-3xl mx-auto">
            <div className="space-y-1">
              <p className="text-[10px] font-mono tracking-[0.2em] text-white font-bold uppercase">Solo Dev Project</p>
              <p className="text-xs text-sky-100/80 leading-relaxed font-medium">Built independently to solve real, everyday college challenges.</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono tracking-[0.2em] text-white font-bold uppercase">Track Everything</p>
              <p className="text-xs text-sky-100/80 leading-relaxed font-medium">Manage assignments, absent logs, exam schedules, and GPA in one place.</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono tracking-[0.2em] text-white font-bold uppercase">Cloud Database</p>
              <p className="text-xs text-sky-100/80 leading-relaxed font-medium">Store and access all your academic data securely in real-time across devices.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-black/10 text-[9px] font-bold text-white/70 uppercase tracking-widest text-center">
        <div className="w-full px-8 md:px-16 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} StudentFlow App. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
