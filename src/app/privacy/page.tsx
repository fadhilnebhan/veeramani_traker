'use client';

import React from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#19182B] text-[#FFF8E8]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#A5A2AD] hover:text-[#F5C542] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#438567]/20 text-[#79d4a8] border border-[#438567]/40">
            PRIVACY STANDARDS & DATA INTEGRITY
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-[#FFF8E8] mt-2">
            Privacy Policy & Anti-Surveillance Charter
          </h1>
          <p className="text-xs text-[#A5A2AD] mt-1">
            Last Updated: October 2026 • Effective Worldwide
          </p>
        </div>

        {/* Core Notice */}
        <div className="p-5 rounded-2xl bg-[#1E1D33] border border-[#7D263D] space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F16F59]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Core Privacy Boundary: Zero Personal Tracking</span>
          </div>
          <p className="text-xs sm:text-sm text-[#C5C2CE] leading-relaxed">
            Veeramani Tracker does not monitor, locate, surveil, or report the private movements or residences of any individual.
            We do not collect background GPS coordinates, crowdsourced stalking tips, or photos taken without consent.
            The platform exists exclusively as an entertainment parody radar indexing creative community folklore, cinema tribute lore, and satirical demonstration signals.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-[#C5C2CE] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              1. Information We Collect
            </h2>
            <p>
              When visitors use Veeramani Tracker:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#A5A2AD]">
              <li>
                <strong>Account Credentials:</strong> If you register, we store your email and hashed password securely using Supabase Auth with Row Level Security.
              </li>
              <li>
                <strong>Public Submissions:</strong> Publicly announced event details, source URLs, and venue names submitted through our form.
              </li>
              <li>
                <strong>Attribution Choice:</strong> If you explicitly consent to display a public handle, that chosen alias is displayed alongside approved events. Otherwise, all submissions remain completely anonymous.
              </li>
              <li>
                <strong>Abuse Prevention Data:</strong> Standard IP-hash tokens are processed strictly for rate-limiting submissions (maximum 5 submissions per hour) and are flushed automatically.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              2. Information We Explicitly Do NOT Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-[#A5A2AD]">
              <li>We never request device-level background geolocation or continuous GPS tracking.</li>
              <li>We never scrape private social media profiles or infer whereabouts from private check-ins.</li>
              <li>We never sell or monetize user data.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              3. Image Upload Standards & Metadata Removal
            </h2>
            <p>
              Any promotional images submitted must represent official event flyers or press banners. All EXIF and GPS geolocation metadata are stripped upon ingestion to prevent accidental location leaks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              4. Your Rights & Account Deletion
            </h2>
            <p>
              You may request immediate account deletion or retraction of submitted public announcements at any time by contacting our moderation team or submitting an update request.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
