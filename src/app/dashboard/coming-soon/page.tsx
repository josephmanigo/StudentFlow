'use client';

import React from 'react';
import { useToast } from '@/context/ToastContext';

const upcomingFeatures = [
  {
    title: 'AI Lecture Notes Generator',
    description: 'Transform raw study transcripts or lecture voice recordings into formatted bullet notes, study guides, and summaries.',
    badge: 'AI Feature',
    badgeColor: 'bg-sky-50 border-sky-100 text-sky-700',
  },
  {
    title: 'AI Flashcard & Quiz Creator',
    description: 'Paste textbook content or upload lecture slides to generate flashcards and interactive practice tests automatically.',
    badge: 'AI Feature',
    badgeColor: 'bg-sky-50 border-sky-100 text-sky-700',
  },
  {
    title: 'Cloud File Upload Vault',
    description: 'Upload and attach class syllabi, readings, and completed homework drafts directly to subjects via Supabase Storage.',
    badge: 'Cloud Storage',
    badgeColor: 'bg-sky-50 border-sky-100 text-sky-700',
  },
  {
    title: 'Advanced Study Correlation Analytics',
    description: 'Discover correlations between your Pomodoro study sessions, attendance rates, and final exam grade scores.',
    badge: 'Analytics',
    badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  },
  {
    title: 'StudentFlow Premium Plan',
    description: 'Collaborate on notes with classmates, sync schedules with Google Calendar, and unlock unlimited AI assistant tokens.',
    badge: 'Premium Plan',
    badgeColor: 'bg-amber-50 border-amber-100 text-amber-700',
  },
];

export default function ComingSoonPage() {
  const { showToast } = useToast();

  const handleVote = (featureTitle: string) => {
    showToast(`Vote received for "${featureTitle}"! We will prioritize this feature.`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-white p-2 md:p-4">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div>
          <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-xs border border-white/10">ROADMAP</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
          What's <span className="font-sans font-extrabold text-sky-100">Coming.</span>
        </h1>
        <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">
          Upcoming features in the StudentFlow development pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingFeatures.map((feat, index) => {
          return (
            <div
              key={index}
              className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:bg-white/15 hover:border-white/25 transition-all duration-300 flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] min-h-[240px]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-lg font-black text-white/30 tracking-wider">
                    0{index + 1}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-white/10 bg-white/10 text-white rounded uppercase tracking-wider">
                    {feat.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-lg text-white group-hover:text-sky-100 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-sky-200/70 font-medium leading-relaxed mt-1">{feat.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={() => handleVote(feat.title)}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white hover:text-sky-100 transition-all cursor-pointer"
                >
                  Upvote Feature
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
