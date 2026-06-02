'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ReactLenis, useLenis } from 'lenis/react';
import { Footer } from "@/components/ui/modem-animated-footer";
import { Twitter, Linkedin, Github, Mail, Menu, X } from "lucide-react";

// Wrap export so ReactLenis is the outermost wrapper
export default function Home() {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, syncTouch: true }}>
      <LandingPage />
    </ReactLenis>
  );
}

const landingFeatures = [
  {
    title: 'Smart Class Scheduling',
    description: 'Automatically organize your class timetable, set reminders for upcoming lectures, and never miss a session again.',
    tag: 'SCHEDULING',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    title: 'AI Study Assistant',
    description: 'Ask questions, get instant explanations, and receive personalized study tips powered by an integrated AI tutor.',
    tag: 'AI-POWERED',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636 6.364l.707-.707M12 21v-1M7.343 16.657l-.707.707M16.657 7.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z',
  },
  {
    title: 'Group Collaboration Rooms',
    description: 'Create shared study rooms, assign group tasks, and collaborate with classmates in real-time on shared notes.',
    tag: 'COLLABORATION',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Deadline Tracker & Alerts',
    description: 'Add assignments, projects, and exams with due dates. Get push alerts days in advance so nothing slips through.',
    tag: 'DEADLINES',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Note-Taking & Flashcards',
    description: 'Write structured notes per subject and auto-generate flashcard sets for active recall study sessions.',
    tag: 'NOTES',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Progress Analytics Dashboard',
    description: 'Visualize your study hours, grade trends, and task completion rates through clean, intuitive charts.',
    tag: 'ANALYTICS',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
];

function LandingPage() {
  const lenis = useLenis();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // useRef to track current section without causing extra re-renders
  const activeSectionRef = React.useRef<string>('home');

  // Sections are stacked: each is 100vh, so section index * innerHeight = target scroll position
  const sectionOrder = ['home', 'features', 'about', 'contact'];

  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, sectionId: string) => {
    e.preventDefault();
    const idx = sectionOrder.indexOf(sectionId);
    if (idx === -1) return;
    const targetY = idx * window.innerHeight;
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }, [lenis]);

  const scrollToTop = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [lenis]);

  // Track active section — only call setState when section actually changes
  // to avoid re-rendering the nav on every scroll frame
  useEffect(() => {
    const handleScrollEvent = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const idx = Math.round(scrollY / vh);
      const clamped = Math.max(0, Math.min(idx, sectionOrder.length - 1));
      const next = sectionOrder[clamped];
      if (next !== activeSectionRef.current) {
        activeSectionRef.current = next;
        setActiveSection(next);
      }
    };
    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollEvent);
  }, []);

  const socialLinks = [
    {
      icon: <Twitter className="w-5 h-5" />,
      href: "https://twitter.com",
      label: "Twitter",
    },
    {
      icon: <Linkedin className="w-5 h-5" />,
      href: "https://linkedin.com",
      label: "LinkedIn",
    },
    {
      icon: <Github className="w-5 h-5" />,
      href: "https://github.com",
      label: "GitHub",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      href: "mailto:support@studentflow.app",
      label: "Email",
    },
  ];

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
      <div className="min-h-screen bg-[#6495ED] text-white flex flex-col relative font-sans">

        {/* Navigation Header - Fixed at top for all stacking sections */}
        <header className="fixed top-0 left-0 w-full z-50">
          <div className="w-full px-4 sm:px-8 md:px-16 py-3 sm:py-4 flex items-center justify-between bg-[#6495ED]/80 backdrop-blur-md border-b border-white/10">
            <Link href="/" onClick={scrollToTop} className="flex items-center gap-1.5 cursor-pointer">
              <img
                src="/studentflow_logo.png"
                alt="StudentFlow Logo"
                width={64}
                height={64}
                className="w-10 h-10 sm:w-14 sm:h-14 object-contain shrink-0"
              />
              <span className="font-black text-lg sm:text-2xl tracking-tighter font-sans uppercase">StudentFlow</span>
            </Link>

            {/* Nav Menu Links - desktop only */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold uppercase tracking-[0.18em]">
              {sectionOrder.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => scrollToSection(e, id)}
                  className={`relative transition-all duration-200 cursor-pointer pb-0.5 ${
                    activeSection === id
                      ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white after:rounded-full'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/auth?mode=login"
                className="text-xs font-bold uppercase tracking-widest text-white/90 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=signup"
                className="px-5 py-2.5 bg-white text-[#6495ED] hover:bg-slate-50 text-xs font-bold rounded-full uppercase tracking-widest transition-all shadow-md shadow-white/5"
              >
                Sign up
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden w-full bg-[#6495ED]/95 backdrop-blur-md border-b border-white/10">
              <nav className="flex flex-col px-6 py-4 gap-1">
                {sectionOrder.map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => { scrollToSection(e, id); setMobileMenuOpen(false); }}
                    className={`py-3 text-sm font-mono font-bold uppercase tracking-[0.18em] border-b border-white/10 last:border-0 transition-colors ${
                      activeSection === id ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col px-6 pb-5 gap-3">
                <Link
                  href="/auth?mode=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-bold uppercase tracking-widest text-white border border-white/30 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center bg-white text-[#6495ED] hover:bg-slate-50 text-sm font-bold rounded-2xl uppercase tracking-widest transition-all shadow-md"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Stacking Sections Article Container — needs 4×100vh height for 4 sticky sections */}
        <article className="relative w-full lg:h-[400vh]">

          {/* 1. Home Section */}
          <section id="home" className="lg:h-screen min-h-screen h-auto w-full bg-[#6495ED] flex items-center justify-center lg:sticky lg:top-0 relative overflow-hidden z-10 pt-28 pb-12 lg:py-0">
            {/* Background Decorative Glow Circles — will-change:transform promotes to GPU layer */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[120px] pointer-events-none z-0" style={{ willChange: 'transform' }} />
            <div className="absolute top-[40%] right-[-15%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px] pointer-events-none" style={{ willChange: 'transform' }} />

            <div className="w-full px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

              {/* Left Column Hero Text */}
              <div className="lg:col-span-6 space-y-8 text-left order-last lg:order-none">
                {/* Active Badge */}
                <div className="inline-flex items-center gap-2 bg-white/12 text-white text-[9px] font-mono tracking-[0.25em] px-4.5 py-2 rounded-full border border-white/18 uppercase shadow-md backdrop-blur-sm">
                  <svg className="w-2.5 h-2.5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 12l10 10 10-10z" />
                  </svg>
                  <span>All-in-One Student Productivity</span>
                </div>

                {/* Titles */}
                <h1 className="text-4xl sm:text-5xl md:text-[56px] lg:text-[72px] font-extrabold tracking-tight leading-[1.05] text-white">
                  Study <span className="font-serif italic font-normal text-sky-100">Smarter.</span><br />
                  Achieve <span className="font-serif italic font-normal bg-clip-text text-transparent bg-gradient-to-r from-white to-sky-100">More.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-sky-100/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl font-medium tracking-wide">
                  StudentFlow helps you stay organized, manage tasks,<br /> and boost productivity — all in one place.
                </p>

                {/* Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link
                    href="/auth?mode=signup"
                    className="px-8 py-4 bg-white hover:bg-sky-50 text-[#6495ED] text-[10px] font-mono font-bold uppercase tracking-[0.2em] rounded-full transition-all shadow-lg hover:shadow-white/10 active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    <span>Get Started for Free</span>
                    <svg className="w-3.5 h-3.5 text-[#6495ED]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <a
                    href="#features"
                    onClick={(e) => scrollToSection(e, 'features')}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold uppercase tracking-[0.2em] rounded-full transition-all border border-white/20 active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>See How It Works</span>
                  </a>
                </div>

                {/* Sub-Badges Row */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <div className="bg-white/12 border border-white/18 text-white text-[9px] font-mono tracking-[0.2em] px-4.5 py-3 rounded-full inline-flex items-center gap-2 uppercase shadow-sm backdrop-blur-sm">
                    <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>All-in-One</span>
                  </div>

                  <div className="bg-white/12 border border-white/18 text-white text-[9px] font-mono tracking-[0.2em] px-4.5 py-3 rounded-full inline-flex items-center gap-2 uppercase shadow-sm backdrop-blur-sm">
                    <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Smart & Easy</span>
                  </div>

                  <div className="bg-white/12 border border-white/18 text-white text-[9px] font-mono tracking-[0.2em] px-4.5 py-3 rounded-full inline-flex items-center gap-2 uppercase shadow-sm backdrop-blur-sm">
                    <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" />
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                    </svg>
                    <span>Track Progress</span>
                  </div>
                </div>
              </div>

              {/* Right Column Mascot Graphic */}
              <div className="lg:col-span-6 flex justify-center items-center relative lg:pt-0 pt-6 z-10 order-first lg:order-none">
                <div className="absolute w-[100%] h-[100%] rounded-full bg-white/10 blur-[100px] pointer-events-none" style={{ willChange: 'transform' }} />
                <div className="relative max-w-xl sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl w-full animate-float select-none lg:-translate-x-28 xl:-translate-x-48">
                  <img
                    src="/studentflow_mascot.png"
                    alt="StudentFlow Mascot Character"
                    className="w-full h-auto drop-shadow-[0_20px_50px_rgba(255,255,255,0.08)]"
                  />
                </div>
              </div>

            </div>
          </section>

          {/* 2. Features Section */}
          <section id="features" className="lg:h-screen min-h-screen h-auto w-full bg-[#6495ED] flex items-center justify-center lg:sticky lg:top-0 relative rounded-tr-[32px] rounded-tl-[32px] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-t border-white/20 z-20 pt-28 pb-12 lg:py-0">
            {/* Background grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="w-full px-8 md:px-16 space-y-10 z-10 lg:max-h-[85vh] lg:overflow-y-auto py-4">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h2 className="text-4xl sm:text-5xl font-serif font-normal italic text-white tracking-tight">Core Academic Modules</h2>
                <p className="text-sky-100 text-[10px] font-mono uppercase tracking-[0.25em] opacity-90">Sleek layout &middot; High standalone productivity</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {landingFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="bg-white/[0.12] border border-white/20 p-8 rounded-3xl space-y-4 hover:shadow-2xl hover:bg-white/[0.18] hover:border-white/30 transition-all duration-300 group text-white relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono tracking-[0.2em] text-sky-100 font-bold uppercase">
                        {feat.tag}
                      </span>
                      <span className="text-[10px] font-mono text-white/20 group-hover:text-white/50 transition-colors duration-500">
                        0{idx + 1}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-normal italic text-white group-hover:text-sky-100 transition-colors duration-300">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-sky-100/80 leading-relaxed font-medium tracking-wide">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. About Section */}
          <section id="about" className="lg:h-screen min-h-screen h-auto w-full bg-[#6495ED] flex items-center justify-center lg:sticky lg:top-0 relative rounded-tr-[32px] rounded-tl-[32px] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t border-white/20 z-30 pt-28 pb-12 lg:py-0">
            {/* Background grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="w-full px-8 md:px-16 max-w-4xl mx-auto text-center z-10 lg:max-h-[85vh] lg:overflow-y-auto py-4 space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal italic text-white tracking-tight leading-tight">
                  Built by Student,<br />For Students.
                </h2>

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
          </section>

          {/* 4. Contact Section */}
          <section id="contact" className="lg:h-screen min-h-screen h-auto w-full bg-[#6495ED] flex flex-col justify-between lg:sticky lg:top-0 relative rounded-tr-[32px] rounded-tl-[32px] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t border-white/10 z-40 pt-28 pb-8 lg:py-0">
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            {/* Contact Body */}
            <div className="w-full px-8 md:px-16 flex-1 flex items-center justify-center z-10 lg:max-h-[80vh] lg:overflow-y-auto py-6">
              <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left text-white">

                {/* Left Column: Let's get in touch! */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.25em] text-sky-100/80 uppercase font-bold block">CONTACT</span>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal italic text-white tracking-tight leading-none">
                      Let&apos;s get in touch!
                    </h2>
                  </div>

                  {/* Grayscale Desk Flatlay */}
                  <div className="relative rounded-3xl overflow-hidden aspect-[16/10] w-full border border-white/15 shadow-2xl bg-white/5 group">
                    <img
                      src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80"
                      alt="Grayscale desk flatlay with tablet and coffee"
                      className="w-full h-full object-cover grayscale opacity-60 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#6495ED]/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Email & Phone Contact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/15">
                    {/* Email Contact */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-mono tracking-[0.25em] uppercase font-bold text-sky-100/90">EMAIL ME</span>
                        <p className="text-[10px] text-sky-100/60 font-medium mt-1">Get a response within a day</p>
                      </div>
                      <div className="pt-1">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText('support@studentflow.app');
                            alert('Email address copied to clipboard!');
                          }} 
                          className="group flex flex-col items-start gap-1 cursor-pointer text-left focus:outline-none"
                        >
                          <span className="text-lg font-serif italic text-white hover:text-sky-100 transition-all border-b border-white/20 hover:border-white pb-0.5">
                            support@studentflow.app
                          </span>
                          <span className="text-[9px] font-mono text-white/30 group-hover:text-white/60 tracking-wider transition-colors uppercase">
                            Click to copy
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Phone Contact */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-mono tracking-[0.25em] uppercase font-bold text-sky-100/90">CALL OR SMS</span>
                        <p className="text-[10px] text-sky-100/60 font-medium mt-1">Available weekdays 9AM - 5PM</p>
                      </div>
                      <div className="pt-1">
                        <a href="tel:+639615596997" className="group flex flex-col items-start gap-1">
                          <span className="text-lg font-serif italic text-white group-hover:text-sky-100 transition-all border-b border-white/20 group-hover:border-white pb-0.5">
                            +63 961 559 6997
                          </span>
                          <span className="text-[9px] font-mono text-white/30 group-hover:text-white/60 tracking-wider transition-colors uppercase">
                            Click to call
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Fill out the form */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.25em] text-sky-100/80 uppercase font-bold block">SEND MESSAGE</span>
                    <h3 className="text-2xl md:text-3xl font-serif font-normal italic text-white tracking-tight leading-tight">
                      Drop me a line
                    </h3>
                    <p className="text-sky-100/80 text-xs font-medium leading-relaxed">
                      Have a feature request, found a bug, or just want to chat about the app? Fill out the form below and I&apos;ll get back to you directly.
                    </p>
                  </div>

                  <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold block">Name</label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold block">Email Address</label>
                      <input
                        type="email"
                        placeholder="you@school.edu"
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold block">Phone Number</label>
                        <span className="text-[9px] font-mono text-sky-200/60 uppercase tracking-widest font-semibold">Optional</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. +63 917 482 3651"
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                      />
                    </div>

                    {/* Message Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold block">How can I help you?</label>
                        <span className="text-[9px] font-mono text-sky-200/60 uppercase tracking-widest font-semibold">Max 500 characters</span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={500}
                        placeholder="Tell me a little bit about what you need..."
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all resize-none font-medium"
                      />
                    </div>


                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-white hover:bg-sky-50 text-[#6495ED] text-xs font-bold font-mono uppercase tracking-[0.25em] rounded-2xl transition-all shadow-lg hover:shadow-white/10 active:scale-[0.98] mt-4 cursor-pointer"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </section>

          {/* 5. Animated Footer */}
          <div className="relative z-50 bg-[#6495ED] text-white rounded-tr-[32px] rounded-tl-[32px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-t border-white/10">
            <Footer
              brandName="StudentFlow"
              brandDescription="An all-in-one student workspace designed independently to track assignments, exams, absent logs, and grades."
              navLinks={navLinks}
              brandIcon={<img src="/studentflow_logo.png" alt="StudentFlow Logo" className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 object-contain" />}
              onNavLinkClick={(e, href) => {
                const sectionId = href.replace('#', '');
                scrollToSection(e, sectionId);
              }}
            />
          </div>

        </article>
      </div>
  );
}
