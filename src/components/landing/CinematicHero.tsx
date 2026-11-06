"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Full-screen opening scene.

   The movement is one photograph on a very slow push-in, animated with a CSS
   transform. The GPU composites a transform, so the motion is smooth at any
   frame rate and any viewport size — no video to decode, resample or step.
   It stops entirely for `prefers-reduced-motion`.
   --------------------------------------------------------------------------- */

export function CinematicHero() {
  const [leaving, setLeaving] = useState(false);

  return (
    <div className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink">
      <img
        src="/media/eixample-street.jpg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="hero-scene-media absolute inset-0 -z-10 h-full w-full object-cover"
      />

      {/* Legibility + warmth. Two layers so the type stays crisp on bright frames. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(18,13,10,0.62)_0%,rgba(18,13,10,0.35)_38%,rgba(18,13,10,0.78)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_10%,rgba(226,43,79,0.14)_0%,rgba(18,13,10,0)_60%)]"
      />

      <header className="relative z-20">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3 text-white">
            <span className="grid size-9 place-items-center rounded-[11px] border border-white/25 bg-white/10 backdrop-blur-md">
              <svg viewBox="0 0 32 32" className="size-[18px] text-white" aria-hidden="true">
                <path
                  d="M9 26V15.2a7 7 0 0 1 14 0V26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.7"
                  strokeLinecap="round"
                />
                <circle cx="19.6" cy="19.6" r="1.9" fill="currentColor" />
              </svg>
            </span>
            <span className="leading-none">
              <span className="block text-[9px] font-semibold tracking-[0.26em] text-white/55 uppercase">
                Casa Barcelona
              </span>
              <span className="mt-1 block font-display text-[19px] leading-none tracking-tight">
                Concierge
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[12.5px] font-medium text-white/70 md:flex">
            <a href="#the-stay" className="transition hover:text-white">
              The stay
            </a>
            <a href="#the-concierge" className="transition hover:text-white">
              The concierge
            </a>
            <a href="#for-hosts" className="transition hover:text-white">
              For hosts
            </a>
            <Link href="/brief" className="transition hover:text-white">
              The brief
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/host/login"
              className="hidden text-[12.5px] font-medium text-white/65 transition hover:text-white sm:inline-flex"
            >
              Host sign in
            </Link>
            <Link
              href="/guest/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[12.5px] font-medium text-white backdrop-blur-md transition hover:border-white/50"
            >
              Guest sign in <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center">
        <div className="container-page w-full py-16">
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.32em] text-white/60 uppercase">
              <span className="h-px w-10 bg-white/35" />
              Eixample · Barcelona
            </p>

            <p className="mt-6 flex flex-wrap items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.22em] text-white/60 uppercase">
              <span className="rounded-full border border-white/25 px-2.5 py-1 text-white/80">
                Airbnb
              </span>
              AI guest-experience layer · working MVP
            </p>

            <h1 className="mt-5 text-[clamp(2.9rem,8.2vw,6.4rem)] leading-[0.92] font-semibold tracking-[-0.04em] text-white">
              <span className="hero-line block">YOUR STAY.</span>
              <span className="hero-line hero-line-2 mt-1 block font-display font-normal italic text-[#F4E4CE]">
                Reimagined.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-[16.5px]">
              A restored Eixample apartment with a concierge that already knows it.
              Verified answers about the home, a curated guide to the city, and a
              direct line to your host — day or night.
            </p>

            <p className="mt-5 max-w-xl border-l-2 border-brand/70 pl-4 text-[13px] leading-relaxed text-white/65">
              <strong className="font-semibold text-white/90">What this is:</strong> a
              working MVP of an AI concierge for Airbnb stays. Every answer comes from
              the host&rsquo;s verified property record, every problem becomes a real
              ticket, and the host works from a dashboard instead of a message queue.
            </p>

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/guest/login"
                onClick={() => setLeaving(true)}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-white px-8 py-4 text-[14.5px] font-medium text-ink transition hover:bg-[#F6EEE3] active:scale-[0.99]"
              >
                <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(226,43,79,0.16),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
                <Play className="size-3.5 fill-brand text-brand" />
                Guest sign in
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="/host/login"
                className="inline-flex items-center gap-2 text-[13px] text-white/70 transition hover:text-white"
              >
                Are you the host? Open the dashboard
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 text-[11px] text-white/55">
              <span>No password · just your booking email and surname</span>
              <span className="hidden h-3 w-px bg-white/20 sm:block" />
              <span>Answers from the host&rsquo;s own record</span>
              <span className="hidden h-3 w-px bg-white/20 sm:block" />
              <span>Maintenance tickets that reach a person</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pb-8">
        <div className="container-page flex items-end justify-between gap-4">
          <a
            href="#the-stay"
            className="group inline-flex flex-col items-center gap-2 text-[10px] tracking-[0.24em] text-white/50 uppercase transition hover:text-white"
          >
            <span className="grid size-9 place-items-center rounded-full border border-white/25 transition group-hover:border-white/60">
              <ArrowDown className="size-3.5" />
            </span>
            Scroll
          </a>
          <p className="max-w-[15rem] text-right text-[10.5px] leading-relaxed text-white/40">
            Photography: freely licensed Wikimedia Commons images. Demonstration
            property and venue data.
          </p>
        </div>
      </div>

      {/* Curtain: the transition into the guest experience. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 z-50 bg-[#0F0B09] transition-opacity duration-700",
          leaving ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
