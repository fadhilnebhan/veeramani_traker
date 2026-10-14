'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Radio,
  PlusCircle,
  ShieldCheck,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Activity
} from 'lucide-react';

interface NavbarProps {
  onOpenReport?: () => void;
}

export function Navbar({ onOpenReport }: NavbarProps = {}) {
  const pathname = usePathname();
  const { user, isDemoMode, loginAsDemoRole, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#19182B]/95 backdrop-blur-md border-b border-[#32304F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark & Tracker Radar Indicator */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F5C542] to-[#F16F59] flex items-center justify-center text-[#19182B] shadow-md group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 stroke-[#19182B]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#438567] border-2 border-[#19182B] animate-ping" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg sm:text-xl tracking-tight text-[#FFF8E8]">
                VEERAMANI <span className="text-[#F5C542]">TRACKER</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 -mt-1 hidden sm:flex">
              <span className="text-[9px] tracking-widest text-[#F16F59] font-mono font-bold uppercase">
                PARODY RADAR
              </span>
              <span className="text-[9px] text-[#A5A2AD] font-mono">• 104.2 MHz DEMO SCAN</span>
            </div>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-[#222038] text-[#F5C542] border border-[#32304F]'
                : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#F5C542]" />
            <span>Radar Map</span>
          </Link>

          {isModeratorOrAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                pathname.startsWith('/admin')
                  ? 'bg-[#7D263D] text-[#FFF8E8] border border-[#9B334E]'
                  : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5C542]" />
              <span>Mod Desk</span>
            </Link>
          )}

          <Link
            href="/account"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 ${
              pathname.startsWith('/account')
                ? 'bg-[#222038] text-[#F5C542] border border-[#32304F]'
                : 'text-[#A5A2AD] hover:text-[#FFF8E8]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Transmissions</span>
          </Link>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Demo Persona Switcher */}
          {isDemoMode && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full bg-[#222038] border border-[#F5C542]/40 text-[#F5C542] hover:bg-[#32304F] transition-colors cursor-pointer"
                title="Switch demo persona"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#79d4a8] animate-pulse" />
                <span>Persona: {user?.role || 'Visitor'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#222038] border border-[#32304F] rounded-xl shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] text-[#A5A2AD] uppercase font-bold tracking-wider border-b border-[#32304F]">
                    Switch Demo Persona
                  </div>
                  <button
                    onClick={() => {
                      loginAsDemoRole('user');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[#FFF8E8] hover:bg-[#32304F] flex items-center justify-between cursor-pointer"
                  >
                    <span>Fan Contributor</span>
                    {user?.role === 'user' && <span className="text-[#F5C542]">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      loginAsDemoRole('moderator');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[#FFF8E8] hover:bg-[#32304F] flex items-center justify-between cursor-pointer"
                  >
                    <span>Lead Moderator</span>
                    {user?.role === 'moderator' && <span className="text-[#F5C542]">✓</span>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Report / Transmit CTA */}
          {onOpenReport ? (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-bold text-xs sm:text-sm rounded-xl shadow-[0_2px_12px_rgba(245,197,66,0.3)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#19182B]" />
              <span className="hidden xs:inline">Report Signal</span>
              <span className="xs:hidden">Report</span>
            </button>
          ) : (
            <Link
              href="/submit"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-bold text-xs sm:text-sm rounded-xl shadow-[0_2px_12px_rgba(245,197,66,0.3)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#19182B]" />
              <span className="hidden xs:inline">Report Signal</span>
              <span className="xs:hidden">Report</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#FFF8E8] hover:text-[#F5C542] rounded-lg bg-[#222038] border border-[#32304F]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1E1D33] border-b border-[#32304F] px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              pathname === '/' ? 'bg-[#222038] text-[#F5C542]' : 'text-[#FFF8E8]'
            }`}
          >
            Parody Radar Map
          </Link>
          {onOpenReport ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReport();
              }}
              className="w-full text-left block px-3 py-2 rounded-lg text-sm font-semibold text-[#F5C542] bg-[#F5C542]/10 border border-[#F5C542]/20 cursor-pointer"
            >
              + Transmit Parody Signal
            </button>
          ) : (
            <Link
              href="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#F5C542] bg-[#F5C542]/10 border border-[#F5C542]/20"
            >
              + Transmit Parody Signal
            </Link>
          )}
          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#FFF8E8]"
          >
            My Transmissions
          </Link>
          {isModeratorOrAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#F16F59] bg-[#7D263D]/20 border border-[#7D263D]/30"
            >
              Moderation Desk
            </Link>
          )}

          {isDemoMode && (
            <div className="pt-2 border-t border-[#32304F]">
              <span className="text-xs text-[#A5A2AD] block mb-1">Demo Persona:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    loginAsDemoRole('user');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 px-2 text-xs rounded border text-center ${
                    user?.role === 'user'
                      ? 'bg-[#F5C542] text-[#19182B] font-bold border-[#F5C542]'
                      : 'bg-[#222038] text-[#FFF8E8] border-[#32304F]'
                  }`}
                >
                  Contributor
                </button>
                <button
                  onClick={() => {
                    loginAsDemoRole('moderator');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 px-2 text-xs rounded border text-center ${
                    user?.role === 'moderator'
                      ? 'bg-[#7D263D] text-[#FFF8E8] font-bold border-[#9B334E]'
                      : 'bg-[#222038] text-[#FFF8E8] border-[#32304F]'
                  }`}
                >
                  Moderator
                </button>
              </div>
            </div>
          )}

          {user && (
            <div className="pt-2 border-t border-[#32304F]">
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-[#7D263D]/20 text-[#ff9d8c] text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
