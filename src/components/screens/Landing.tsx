"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeroVariant } from "@/lib/types";
import { MiniTab } from "@/components/ui/TabBar";

export function LandingScreen() {
  const router = useRouter();
  const [hero, setHero] = useState<HeroVariant>("a");

  return (
    <section className="min-h-full flex flex-col animate-fade md:max-w-[560px] md:mx-auto md:w-full">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-[20px] pt-[18px] pb-[10px] md:px-0" style={{ borderBottom: "1px solid var(--lime)" }}>
        <span className="font-[family-name:var(--font-grotesk)] font-bold text-[18px] tracking-[0.04em] text-[#141016]">
          TRYON
        </span>
        <button
          onClick={() => router.push("/auth?mode=login")}
          className="border-none bg-none cursor-pointer font-[family-name:var(--font-mono)] text-[12px] tracking-[0.12em] uppercase text-[#141016]"
        >
          Log in →
        </button>
      </div>

      {/* Hero A */}
      {hero === "a" && (
        <div className="px-[20px] pt-[8px] md:px-0 md:pt-[16px]">
          <div
            className="relative w-full rounded-[20px] overflow-hidden border border-[rgba(20,16,22,0.08)] md:max-h-[40vh]"
            style={{ aspectRatio: "1535 / 1024" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-editorial.jpg"
              alt="Before and after — AI fashion try-on"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
          <div className="pt-[22px] md:pt-[14px]">
            <h1 className="m-0 font-[family-name:var(--font-bodoni)] font-medium text-[46px] leading-[0.96] tracking-[-0.01em] text-[#141016]">
              See it on <em>you</em><br />before you buy.
            </h1>
          </div>
        </div>
      )}

      {/* Hero B */}
      {hero === "b" && (
        <div className="px-[20px] pt-[14px] md:px-0">
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
            Issue 01 — The Fitting Room
          </span>
          <h1 className="mt-[10px] mb-0 font-[family-name:var(--font-bodoni)] font-medium text-[54px] leading-[0.92] tracking-[-0.015em] text-[#141016]">
            Try it<br /><em>on.</em><br />Then decide.
          </h1>
          <div className="flex gap-[14px] mt-[18px] items-stretch">
            <div className="flex-1 relative h-[200px] md:h-[42vh] rounded-[18px] overflow-hidden border border-[rgba(20,16,22,0.08)] bg-[#EAE5F5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-editorial.jpg"
                alt="Before and after — AI fashion try-on"
                className="absolute inset-0 w-full h-full object-contain object-center"
              />
            </div>
            <div className="w-[96px] flex flex-col justify-between font-[family-name:var(--font-mono)] text-[11px] tracking-[0.06em] text-[#6B6470]">
              <span>01 / Upload</span>
              <span>02 / Analyze</span>
              <span>03 / Try on</span>
              <span className="text-[#141016]">AI · 2.9s</span>
            </div>
          </div>
        </div>
      )}

      {/* Body copy */}
      <div className="px-[20px] pt-[18px] md:px-0 md:pt-[12px]">
        <p className="m-0 font-[family-name:var(--font-grotesk)] text-[15px] leading-[1.5] text-[#6B6470] max-w-[340px]">
          Upload a photo, drop a clothing link, and our AI dresses you in seconds — with a fit, color and styling verdict before you spend a cent.
        </p>
      </div>

      <div className="flex-1" />

      {/* CTAs */}
      <div className="px-[20px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-[22px] md:px-0 md:pb-[32px] md:pt-[16px]">
        <button
          onClick={() => router.push("/auth?mode=register")}
          className="w-full box-border py-[17px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
          style={{ background: "var(--lav)" }}
        >
          Create your account
        </button>
        <button
          onClick={() => router.push("/auth?mode=login")}
          className="w-full box-border py-[15px] mt-[10px] rounded-full border border-[rgba(20,16,22,0.14)] bg-white font-[family-name:var(--font-grotesk)] font-medium text-[14px] text-[#141016] cursor-pointer"
        >
          I already have an account
        </button>

        {/* Hero variant toggle */}
        <div className="flex items-center justify-center gap-[8px] mt-[18px]">
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#B6ADA8]">
            Hero layout
          </span>
          <MiniTab
            labels={["A", "B"]}
            active={hero.toUpperCase()}
            onChange={(v) => setHero(v.toLowerCase() as HeroVariant)}
          />
        </div>
      </div>
    </section>
  );
}
