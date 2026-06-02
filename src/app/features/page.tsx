'use client';

import React from 'react';
import Link from 'next/link';

const landingFeatures = [
  {
    title: 'Semester & Course Workspace',
    description: 'Structure subjects, room schedules, times, and instructor details in a singular unified view.',
    tag: 'STRUCTURE',
    tagColor: 'text-sky-700 bg-sky-50 border-sky-100',
  },
  {
    title: 'Assignment Status Columns',
    description: 'Track milestones across not started, in progress, and submitted columns with detailed textual trackers.',
    tag: 'MILESTONES',
    tagColor: 'text-sky-700 bg-sky-50 border-sky-100',
  },
  {
    title: 'Weighted GPA Forecasts',
    description: 'Solve real-time weighted averages and simulate scores required on remaining final exams.',
    tag: 'FORECASTING',
    tagColor: 'text-sky-700 bg-sky-50 border-sky-100',
  },
  {
    title: 'Attendance Alert Logs',
    description: 'Record lecture attendance and receive warning notices when your active rate falls below 75%.',
    tag: 'LOGISTICS',
    tagColor: 'text-sky-700 bg-sky-50 border-sky-100',
  },
  {
    title: 'Focus Pomodoro Intervals',
    description: 'Enhance focus via 25-minute intervals. Automatically log study time and play synthesized acoustic signals.',
    tag: 'PRODUCTIVITY',
    tagColor: 'text-sky-700 bg-sky-50 border-sky-100',
  },
  {
    title: 'AI Academic Tutor Support',
    description: 'Formulate questions and receive detailed academic concept clarifications and sample solutions.',
    tag: 'ASSISTANCE',
    tagColor: 'text-sky-700 bg-sky-50 border-sky-100',
  },
];

export default function FeaturesPage() {
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
      <main className="flex-1 w-full px-8 md:px-16 py-16 z-10 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="px-3 py-1.5 bg-white/20 border border-white/25 rounded-full font-bold text-[9px] text-white uppercase tracking-widest">
            Features Guide
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight">Core Academic Modules</h1>
          <p className="text-sky-100 text-sm font-semibold max-w-md mx-auto leading-relaxed">
            A comprehensive look at our zero-distraction productivity tools designed exclusively for college academics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {landingFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white/80 border border-white/20 p-8 rounded-3xl space-y-5 shadow-lg hover:shadow-xl hover:bg-white transition-all group text-slate-800"
            >
              <span className={`px-2.5 py-1 rounded font-bold text-[8px] border uppercase tracking-wider ${feat.tagColor}`}>
                {feat.tag}
              </span>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-lg uppercase tracking-wide group-hover:text-[#6495ED] transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{feat.description}</p>
              </div>
            </div>
          ))}
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
