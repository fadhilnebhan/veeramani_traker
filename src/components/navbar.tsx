'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  MapPin,
  PlusCircle,
  Menu,
  X,
  LogOut,
  Search
} from 'lucide-react';

interface NavbarProps {
  onOpenReport?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Navbar({ onOpenReport, searchQuery, onSearchChange }: NavbarProps = {}) {
  const pathname = usePathname();
  const { user, isDemoMode, loginAsDemoRole, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#19182B]/95 backdrop-blur-md border-b border-[#32304F]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Small Original Wordmark */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#F5C542] to-[#F16F59] flex items-center justify-center text-[#19182B] shadow-md group-hover:scale-105 transition-transform">
            <MapPin className="w-4 h-4 fill-[#19182B] stroke-[#19182B]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-sm sm:text-lg tracking-tight text-[#FFF8E8] leading-none">
              VEERAMANI <span className="text-[#F5C542]">TRACKER</span>
            </span>
          </div>
        </Link>

        {/* Center: Compact Map Search Control */}
        {onSearchChange !== undefined && (
          <div className="flex-1 max-w-xs sm:max-w-sm mx-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-[#A5A2AD] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search city, venue or note..."
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-xs bg-[#151424] border border-[#32304F] hover:border-[#F5C542]/50 focus:border-[#F5C542] rounded-xl text-[#FFF8E8] placeholder:text-[#A5A2AD]/60 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A5A2AD] hover:text-[#FFF8E8] text-xs p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prominent Turmeric-Yellow Report Button */}
          {onOpenReport ? (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-display font-black text-xs sm:text-sm rounded-xl shadow-[0_2px_12px_rgba(245,197,66,0.3)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#19182B]" />
              <span className="hidden xs:inline">Report</span>
              <span className="hidden md:inline">Appearance</span>
            </button>
          ) : (
            <Link
              href="/submit"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#F5C542] to-[#D4A325] hover:from-[#FCE8A1] hover:to-[#F5C542] text-[#19182B] font-display font-black text-xs sm:text-sm rounded-xl shadow-[0_2px_12px_rgba(245,197,66,0.3)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#19182B]" />
              <span className="hidden xs:inline">Report</span>
              <span className="hidden md:inline">Appearance</span>
            </Link>
          )}

          {/* Small Menu for Account functionality */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 text-[#FFF8E8] hover:text-[#F5C542] rounded-xl bg-[#222038] border border-[#32304F] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Account & Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="bg-[#1E1D33] border-b border-[#32304F] px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-xs font-semibold ${
              pathname === '/' ? 'bg-[#222038] text-[#F5C542]' : 'text-[#FFF8E8]'
            }`}
          >
            Map View
          </Link>
          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-semibold text-[#FFF8E8] hover:bg-[#222038]"
          >
            My Submissions
          </Link>
          {isModeratorOrAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-[#F16F59] bg-[#7D263D]/20 border border-[#7D263D]/30"
            >
              Moderation Desk
            </Link>
          )}

          {isDemoMode && (
            <div className="pt-2 border-t border-[#32304F]">
              <span className="text-[10px] text-[#A5A2AD] block mb-1">Demo Persona:</span>
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
