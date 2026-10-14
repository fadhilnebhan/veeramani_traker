'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#151424] border-t border-[#32304F] text-[#A5A2AD] text-xs py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Core Disclaimer Box */}
        <div className="p-4 rounded-xl bg-[#1E1D33] border border-[#7D263D]/40 text-[#FFF8E8]/90 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-[#7D263D]/30 text-[#F16F59] shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-semibold text-[#F5C542]">
              Strict Fan Parody & Fictional Demonstration Disclaimer:
            </p>
            <p className="text-[#C5C2CE]">
              Veeramani Tracker is an unofficial, community-operated parody tracker. It is NOT affiliated with, authorized, or endorsed by Veeramani or any organization.
              This platform does NOT function as an actual person-location service and does NOT track or disclose anyone&apos;s real-world whereabouts, coordinates, or private residences.
              All radar pins represent clearly fictional demonstration signals and creative community satire.
            </p>
          </div>
        </div>

        {/* Links & Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#32304F]">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-[#F5C542] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#F5C542] transition-colors">
              Terms of Use & Parody Guidelines
            </Link>
            <span>•</span>
            <Link href="/submit" className="hover:text-[#F5C542] transition-colors">
              Transmit Parody Signal
            </Link>
            <span>•</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F5C542] transition-colors"
            >
              Map Data &copy; OpenStreetMap
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#A5A2AD]">
            <span>Crafted with Tamil Nadu internet spirit</span>
            <Heart className="w-3.5 h-3.5 text-[#F16F59] fill-[#F16F59]" />
            <span>2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
