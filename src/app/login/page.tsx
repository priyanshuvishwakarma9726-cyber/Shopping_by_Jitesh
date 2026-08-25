'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/context/toast-context';

function LoginFormContent() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get('next') || '/account';
  const supabase = createClient();
  const { showToast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide both email address and password.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Incorrect email or password. Please verify your credentials and try again.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        showToast('Sign in successful. Welcome back!', 'success');
        router.push(nextRoute);
        router.refresh();
      }
    } catch {
      setErrorMsg('An unexpected error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Please fill in all required account fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setErrorMsg('An account with this email address already exists. Try signing in instead.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        showToast('Account created successfully!', 'success');
        router.push(nextRoute);
        router.refresh();
      }
    } catch {
      setErrorMsg('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
          Customer Portal
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shopping by Jitesh</h1>
        <p className="text-xs text-stone-500 font-semibold">
          Access your personal orders, addresses, and wishlist.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-sm">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl text-xs font-bold text-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl transition-all ${
              tab === 'login' ? 'bg-white shadow-xs text-slate-900' : 'text-stone-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-xl transition-all ${
              tab === 'register' ? 'bg-white shadow-xs text-slate-900' : 'text-stone-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={tab === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Password</label>
              {tab === 'login' && (
                <Link href="/forgot-password" className="text-[11px] font-bold text-amber-600 hover:text-amber-700">
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none"
                required
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-slate-900"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-slate-900 hover:bg-slate-800 font-bold py-3 text-sm mt-2"
            isLoading={loading}
          >
            {tab === 'login' ? 'Sign In to Account' : 'Register New Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center text-sm font-semibold">Loading authentication portal...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
