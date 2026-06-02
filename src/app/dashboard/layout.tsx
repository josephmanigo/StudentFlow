'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, Menu } from 'lucide-react';

const navItems = [
  { name: 'DASHBOARD', href: '/dashboard' },
  { name: 'SUBJECTS', href: '/dashboard/subjects' },
  { name: 'ASSIGNMENTS', href: '/dashboard/assignments' },
  { name: 'EXAMS', href: '/dashboard/exams' },
  { name: 'GRADES', href: '/dashboard/grades' },
  { name: 'ATTENDANCE', href: '/dashboard/attendance' },
  { name: 'FOCUS TIMER', href: '/dashboard/pomodoro' },
  { name: 'PLANNER', href: '/dashboard/planner' },
  { name: 'STUDY CHAT', href: '/dashboard/ai-assistant', badge: 'AI' },
  { name: 'ROADMAP', href: '/dashboard/coming-soon' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, semesters, activeSemester, signOut, isLocalMode } = useData();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication & Onboarding Protection
  useEffect(() => {
    if (!session.loading) {
      if (!session.user) {
        showToast('Please sign in to access StudentFlow', 'info');
        router.push('/auth');
      } else if (semesters.length === 0 && pathname !== '/onboarding') {
        showToast('Set up your current semester to get started!', 'info');
        router.push('/onboarding');
      }
    }
  }, [session.user, session.loading, semesters, router, pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out successfully');
      router.push('/');
    } catch (error) {
      showToast('Error signing out', 'error');
    }
  };

  if (session.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading StudentFlow</p>
        </div>
      </div>
    );
  }

  if (!session.user) {
    return null; // Let the redirect handle it
  }

  return (
    <div className="min-h-screen w-full flex bg-[#6495ED]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="bg-[#6495ED] p-1.5 rounded-xl flex items-center justify-center shrink-0 w-11 h-11 shadow-sm shadow-[#6495ED]/20">
              <img
                src="/studentflow_logo.png"
                alt="StudentFlow Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-800 font-sans uppercase">StudentFlow</span>
          </Link>
        </div>

        {/* Current Semester Section */}
        {activeSemester && (
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
            <span className="text-[9.5px] font-mono tracking-[0.2em] text-slate-500 font-bold uppercase block">Active Semester</span>
            <p className="text-sm font-sans font-bold text-slate-800 mt-0.5 truncate">{activeSemester.name}</p>
            <p className="text-[11px] font-mono tracking-wider text-slate-500 truncate mt-0.5">{activeSemester.school_name}</p>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto pr-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between py-2.5 transition-all duration-250 text-[11px] font-mono font-bold uppercase tracking-[0.18em] group border-l-[3.5px] ${
                  isActive
                    ? 'bg-[#6495ED]/8 text-[#6495ED] border-[#6495ED] pl-3.5 rounded-r-xl'
                    : 'text-slate-450 hover:bg-slate-50/60 hover:text-slate-800 border-transparent pl-3.5 rounded-r-xl'
                }`}
              >
                <span>{item.name}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest bg-[#6495ED]/10 text-[#6495ED] border border-[#6495ED]/10 rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-3">
          <div className="px-3.5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <p className="text-xs font-sans font-bold text-slate-800 truncate">
              {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5 font-bold uppercase tracking-wider">{session.user.email}</p>
          </div>
          
          {isLocalMode && (
            <div className="px-2 py-1 text-[9px] font-mono tracking-[0.2em] uppercase bg-emerald-50 text-emerald-700 border border-emerald-100/50 rounded-lg text-center font-bold">
              Local Database
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-rose-500 hover:bg-rose-50/60 rounded-xl transition-all cursor-pointer"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 max-w-xs bg-white h-full shadow-2xl z-50 animate-slide-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                <div className="bg-[#6495ED] p-1.5 rounded-xl flex items-center justify-center shrink-0 w-11 h-11 shadow-sm shadow-[#6495ED]/20">
                  <img
                    src="/studentflow_logo.png"
                    alt="StudentFlow Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-800 font-sans uppercase">StudentFlow</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-650 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Semester Section */}
            {activeSemester && (
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <span className="text-[9.5px] font-mono tracking-[0.2em] text-slate-500 font-bold uppercase block">Active Semester</span>
                <p className="text-sm font-sans font-semibold text-slate-700 mt-0.5 truncate">{activeSemester.name}</p>
                <p className="text-[11px] font-mono tracking-wider text-slate-500 truncate mt-0.5">{activeSemester.school_name}</p>
              </div>
            )}

            {/* Navigation items */}
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto pr-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between py-2.5 transition-all duration-250 text-[11px] font-mono font-bold uppercase tracking-[0.18em] group border-l-[3.5px] ${
                      isActive
                        ? 'bg-[#6495ED]/8 text-[#6495ED] border-[#6495ED] pl-3.5 rounded-r-xl'
                        : 'text-slate-455 hover:bg-slate-50/60 hover:text-slate-800 border-transparent pl-3.5 rounded-r-xl'
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest bg-[#6495ED]/10 text-[#6495ED] border border-[#6495ED]/10 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 flex flex-col gap-3 bg-slate-50/30">
              <div className="px-3.5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-xs font-sans font-bold text-slate-800 truncate">
                  {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5 font-bold uppercase tracking-wider">{session.user.email}</p>
              </div>
              
              {isLocalMode && (
                <div className="px-2 py-1 text-[9px] font-mono tracking-[0.2em] uppercase bg-emerald-50 text-emerald-700 border border-emerald-100/50 rounded-lg text-center font-bold">
                  Local Database
                </div>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-rose-500 hover:bg-rose-50/60 rounded-xl transition-all cursor-pointer"
              >
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden w-full flex items-center justify-between p-3 bg-white border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-650 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#6495ED] p-1 rounded-lg flex items-center justify-center shrink-0 w-8 h-8 shadow-sm shadow-[#6495ED]/10">
                <img
                  src="/studentflow_logo.png"
                  alt="StudentFlow Logo"
                  className="w-5 h-5 object-contain"
                />
              </div>
              <span className="font-black text-base tracking-tighter text-slate-800 font-sans uppercase">StudentFlow</span>
            </div>
          </div>
          {activeSemester && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg max-w-[120px] truncate">
              {activeSemester.name}
            </span>
          )}
        </header>

        {/* Dashboard Pages Root */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 animate-fade-in bg-[#6495ED]">
          {children}
        </main>
      </div>
    </div>
  );
}
