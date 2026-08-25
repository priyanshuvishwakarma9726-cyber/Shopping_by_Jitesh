'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSubmitted(true);
      }
    } catch {
      setErrorMsg('Failed to send password reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-600">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</h1>
        <p className="text-xs text-stone-500 font-semibold">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-sm">
        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Recovery Email Sent</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              If an account exists for <span className="font-bold text-slate-900">{email}</span>, you will receive password reset instructions shortly.
            </p>
            <Link href="/login">
              <Button variant="secondary" className="w-full mt-2 text-xs font-bold">
                Return to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                {errorMsg}
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

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-slate-900 hover:bg-slate-800 font-bold py-3 text-sm"
              isLoading={loading}
            >
              Send Password Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
