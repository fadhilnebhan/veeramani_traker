'use client';

import React from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfUsePage() {
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
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#F5C542]/20 text-[#F5C542] border border-[#F5C542]/40">
            COMMUNITY CHARTER & LEGAL TERMS
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-[#FFF8E8] mt-2">
            Terms of Use & Verification Guidelines
          </h1>
          <p className="text-xs text-[#A5A2AD] mt-1">
            Rules governing submission, indexing, and moderation on Veeramani Tracker
          </p>
        </div>

        {/* Disclaimer Callout */}
        <div className="p-5 rounded-2xl bg-[#1E1D33] border border-[#F5C542]/40 space-y-2">
          <h2 className="text-sm font-bold text-[#F5C542]">
            Unofficial Fan Parody Notice:
          </h2>
          <p className="text-xs sm:text-sm text-[#C5C2CE] leading-relaxed">
            Veeramani Tracker is an independently operated cultural tribute and parody product inspired by Tamil Nadu internet culture.
            It is not authorized, sponsored, or affiliated with Veeramani, his management, or legal representatives.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-[#C5C2CE] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              1. Permitted Submissions
            </h2>
            <p>
              Users may only submit fictional parody radar entries that satisfy the following criteria:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#A5A2AD]">
              <li>
                The content is <strong>100% fictional satire, community folklore, or cinema tribute lore</strong>.
              </li>
              <li>
                The chosen sector is a <strong>broad public cultural landmark or public district</strong> (e.g. Marina Beach, Rockfort, Teppakulam).
              </li>
              <li>
                The submitter explicitly certifies that the entry does NOT claim to reveal anyone&apos;s real-world whereabouts, coordinates, or private details.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              2. Strict Prohibitions & Anti-Stalking Policy
            </h2>
            <p>
              The following actions will result in immediate permanent blocking and removal:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#A5A2AD]">
              <li>Submitting home addresses, private residence details, apartment numbers, or hotel locations.</li>
              <li>Submitting personal sightings (e.g. &quot;spotted eating lunch at X restaurant&quot; or &quot;driving down Y road&quot;).</li>
              <li>Submitting coordinates obtained through surreptitious following or harassment.</li>
              <li>Attempting to bypass the human moderation workflow or abuse server rate limits.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              3. Human Moderation & Content Removal
            </h2>
            <p>
              All submissions are placed in a moderation queue and undergo review by authorized human moderators before appearing publicly on the map.
              We reserve the absolute right to reject, modify, or remove any listing at any time for safety, privacy, or factual inaccuracy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#FFF8E8] font-display">
              4. Disclaimer of Warranties
            </h2>
            <p>
              Schedules and public appearances are subject to change, postponement, or cancellation by event organizers.
              Veeramani Tracker makes no guarantees regarding the punctuality, seating availability, or attendance of any featured personality.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
