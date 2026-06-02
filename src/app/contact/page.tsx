'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    }
  };

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
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left text-white">
          
          {/* Left Column: Let's get in touch! */}
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-3xl sm:text-4xl font-serif font-normal italic text-white tracking-tight leading-tight">
              Let&apos;s get in touch!
            </h2>
            
            {/* Grayscale Desk Flatlay */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] w-full border border-white/20 shadow-sm bg-white/5">
              <img
                src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80"
                alt="Grayscale desk flatlay with tablet and coffee"
                className="w-full h-full object-cover grayscale opacity-80"
              />
            </div>

            {/* Reach Us note with hand-drawn style arrow */}
            <div className="relative flex items-center gap-4 py-2">
              <span className="font-serif italic text-white font-semibold text-lg tracking-wide transform -rotate-2 inline-block">
                You can <span className="underline decoration-wavy">reach us</span> at the following
              </span>
              <svg className="w-8 h-8 text-white animate-bounce shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3c3 6 8 9 12 6m0 0v-4m0 4h-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Email & Phone Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/20">
              {/* Email Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-sky-100">Email</span>
                </div>
                <p className="text-[10px] text-sky-100/70 font-semibold leading-relaxed">We usually email you back within an hour</p>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigator.clipboard.writeText('support@studentflow.app')}>
                  <span className="text-xs font-bold text-white hover:text-sky-100 transition-colors">support@studentflow.app</span>
                  <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
              </div>

              {/* Phone Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-sky-100">Phone</span>
                </div>
                <p className="text-[10px] text-sky-100/70 font-semibold leading-relaxed">Weekdays from 9AM to 5PM</p>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigator.clipboard.writeText('+63 (905) 521 0329')}>
                  <span className="text-xs font-bold text-white hover:text-sky-100 transition-colors">+63 (905) 521 0329</span>
                  <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fill out the form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-xl md:text-2xl font-bold font-serif italic text-white tracking-tight leading-tight">
                Fill out the form below to get started
              </h3>
              <p className="text-sky-100/80 text-xs font-medium leading-relaxed">
                Let us know about your workspace needs and we will get back to you with setup details.
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-sky-100/90">Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-sky-200/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-sky-100/90">Email</label>
                <input
                  type="email"
                  placeholder="you@school.edu"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-sky-200/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white transition-all"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-sky-100/90">Phone</label>
                  <span className="text-[9px] font-bold text-sky-200/70 tracking-wide">Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. +63 (905) 521 0329"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-sky-200/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white transition-all"
                />
              </div>

              {/* Message Textarea */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-sky-100/90">How can we help you?</label>
                  <span className="text-[9px] font-bold text-sky-200/70 tracking-wide">Max 500 characters</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Tell us a little bit about your setup requirements..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-sky-200/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white transition-all resize-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-sky-100/90">Expected services</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-sky-100/90 font-medium">
                  <label className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" className="rounded border-white/30 bg-white/10 text-white focus:ring-white focus:ring-offset-[#6495ED] w-3.5 h-3.5" />
                    <span>Academic Workspace Setup</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" className="rounded border-white/30 bg-white/10 text-white focus:ring-white focus:ring-offset-[#6495ED] w-3.5 h-3.5" />
                    <span>Custom Feature Integration</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" className="rounded border-white/30 bg-white/10 text-white focus:ring-white focus:ring-offset-[#6495ED] w-3.5 h-3.5" />
                    <span>Study Coaching Assistant</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" className="rounded border-white/30 bg-white/10 text-white focus:ring-white focus:ring-offset-[#6495ED] w-3.5 h-3.5" />
                    <span>Other / General Inquiries</span>
                  </label>
                </div>
              </div>

              {/* Turnstile verification success */}
              <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-between text-[11px] text-white font-medium shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Security verification completed</span>
                </div>
                <span className="font-mono text-white font-bold uppercase tracking-wider text-[9px]">Verified</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 bg-white hover:bg-slate-50 text-[#6495ED] text-xs font-bold rounded-xl uppercase tracking-widest transition-all shadow-md mt-2 cursor-pointer"
              >
                Submit
              </button>
            </form>
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
