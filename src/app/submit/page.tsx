'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ReportPanel } from '@/components/report-panel';
import { ArrowLeft, Radio } from 'lucide-react';

export default function SubmitSignalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {/* Navigation Breadcrumb / Back button */}
        <div className="w-full max-w-md mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A5A2AD] hover:text-[#F5C542] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Radar Map</span>
          </Link>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#222038] text-[#F5C542] border border-[#32304F]">
            Parody Dispatch
          </span>
        </div>

        {/* Centered Compact Report Panel */}
        <div className="w-full">
          <ReportPanel />
        </div>

        {/* Additional Parody Context */}
        <div className="w-full max-w-md mt-6 p-3 rounded-xl bg-[#222038]/60 border border-[#32304F] text-center text-xs text-[#A5A2AD]">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#F16F59] mb-1">
            <Radio className="w-3.5 h-3.5" />
            <span>Strict Anti-Stalking Policy</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            Veeramani Tracker is an internet parody. Do not report real-world whereabouts, private residences, or real coordinates of any individual.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
