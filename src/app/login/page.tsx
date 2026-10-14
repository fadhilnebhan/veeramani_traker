'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const { isDemoMode, loginAsDemoRole } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError('Supabase credentials have not been configured yet. Please use the Demo Sign-In options below.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email inbox for the confirmation verification link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: 'user' | 'moderator') => {
    loginAsDemoRole(role);
    if (role === 'moderator') {
      router.push('/admin');
    } else {
      router.push('/account');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="rounded-3xl bg-[#1E1D33] border border-[#32304F] p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Brand Heading */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F5C542] to-[#F16F59] text-[#19182B] flex items-center justify-center mx-auto shadow-md">
              <MapPin className="w-6 h-6 fill-[#19182B] stroke-[#19182B]" />
            </div>
            <h1 className="text-2xl font-bold font-display text-[#FFF8E8] pt-2">
              {isSignUp ? 'Join Veeramani Tracker' : 'Sign In to Tracker'}
            </h1>
            <p className="text-xs text-[#A5A2AD]">
              Track your submitted public appearances & contributor status
            </p>
          </div>

          {/* Quick Demo Switcher if in Demo Mode */}
          {isDemoMode && (
            <div className="p-4 rounded-2xl bg-[#222038] border border-[#F5C542]/30 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5C542]">
                <Sparkles className="w-3.5 h-3.5 text-[#F16F59]" />
                <span>One-Click Demo Personas:</span>
              </div>
              <p className="text-[11px] text-[#A5A2AD]">
                Running without external Supabase credentials? Click either role to test instantly:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('user')}
                  className="py-2 px-3 rounded-xl bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs text-center transition-colors cursor-pointer"
                >
                  Contributor Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('moderator')}
                  className="py-2 px-3 rounded-xl bg-[#7D263D] hover:bg-[#9B334E] text-[#FFF8E8] font-bold text-xs text-center transition-colors cursor-pointer"
                >
                  Moderator Mode
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-[#F16F59]/20 border border-[#F16F59] text-xs text-[#ff9d8c] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-[#438567]/20 border border-[#438567] text-xs text-[#79d4a8] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Supabase Email/Password Form */}
          <form onSubmit={handleSupabaseAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#A5A2AD] block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5A2AD]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-xs sm:text-sm text-[#FFF8E8] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#A5A2AD] block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5A2AD]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#151424] border border-[#32304F] focus:border-[#F5C542] rounded-xl text-xs sm:text-sm text-[#FFF8E8] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#F5C542] hover:bg-[#D4A325] text-[#19182B] font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Contributor Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#32304F]">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-[#F5C542] hover:underline cursor-pointer"
            >
              {isSignUp
                ? 'Already have an account? Sign in here'
                : 'Need an account? Register to track submissions'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
