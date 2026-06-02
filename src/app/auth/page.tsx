'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const { session, signIn, signUp, signInWithGoogle, isLocalMode } = useData();
  const { showToast } = useToast();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'signup') return false;
    }
    return true;
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session.loading && session.user) {
      router.push('/dashboard');
    }
  }, [session.user, session.loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !fullName)) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        showToast('Logged in successfully!');
        router.push('/dashboard');
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        showToast('Account created successfully! Redirecting to setup...');
        router.push('/onboarding');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred during authentication';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      if (isLocalMode) {
        showToast('Logged in with Simulated Google Account!');
        router.push('/dashboard');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Google Auth error';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#6495ED] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-white font-sans">
      
      {/* Decorative blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px] pointer-events-none z-0" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-8 z-20">
        <Link href="/" className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-sky-100 hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center flex flex-col items-center px-4">
        <Link href="/" className="inline-flex items-center gap-1.5">
          <img
            src="/studentflow_logo.png"
            alt="StudentFlow Logo"
            width={80}
            height={80}
            className="w-16 h-16 object-contain shrink-0"
          />
          <span className="font-black text-2xl tracking-tighter text-white uppercase">StudentFlow</span>
        </Link>
        
        <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {isLogin ? (
            <>
              Sign in to <span className="font-serif italic font-normal text-sky-100">StudentFlow.</span>
            </>
          ) : (
            <>
              Create your <span className="font-serif italic font-normal text-sky-100">account.</span>
            </>
          )}
        </h2>
        
        <p className="mt-3 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-sky-100/70">
          Or{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white hover:text-sky-100 font-bold transition-colors focus:outline-none cursor-pointer underline underline-offset-4"
          >
            {isLogin ? 'create a new account' : 'sign in to your existing account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/10 border border-white/20 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-[32px] shadow-2xl relative overflow-hidden">
          
          {isLocalMode && (
            <div className="mb-6 p-4 rounded-2xl bg-white/10 border border-white/15 text-white">
              <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded-md font-mono font-bold tracking-[0.2em] text-[8px] mb-2 border border-white/10">LOCAL DATABASE MODE</span>
              <p className="text-xs text-sky-100/90 mt-1 font-medium leading-relaxed">
                No backend configurations detected. Enter any mock credentials to login locally.
              </p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Joseph Student"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joseph@college.edu"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono tracking-[0.25em] uppercase text-sky-100/80 font-bold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder-sky-200/40 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-white hover:bg-sky-50 text-[#6495ED] text-xs font-bold font-mono uppercase tracking-[0.25em] rounded-2xl transition-all shadow-lg hover:shadow-white/10 active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center min-h-[50px]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#6495ED] border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-[1px] bg-white/10 flex-1" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-sky-100/60 shrink-0">Or continue with</span>
              <div className="h-[1px] bg-white/10 flex-1" />
            </div>

            <div>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono font-bold uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.44 0-6.228-2.788-6.228-6.228 0-3.44 2.788-6.229 6.228-6.229 1.5 0 2.87.53 3.93 1.402l3.14-3.14C18.995 2.502 15.86 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.24-4.542 11.24-11.24 0-.763-.085-1.503-.24-2.235H12.24z"/>
                </svg>
                <span>Google Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
