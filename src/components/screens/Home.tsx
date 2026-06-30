"use client";

import { useRouter } from "next/navigation";

export function HomeScreen() {
  const router = useRouter();

  return (
    <section className="min-h-full flex flex-col animate-fade">
      {/* Banner */}
      <div className="px-[20px] pt-[18px]">
        <div className="relative rounded-[18px] overflow-hidden border border-[rgba(20,16,22,0.08)] md:h-[38vh]" style={{ background: "#EDE5F2" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/how-tryon-works.jpg"
            alt="How TRYON Works"
            className="w-full h-auto block md:absolute md:inset-0 md:w-full md:h-full md:object-contain"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Heading */}
      <div className="px-[20px] pt-[26px] text-center md:pt-[16px]">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
          Ready when you are
        </span>
        <h1 className="mt-[8px] mb-0 font-[family-name:var(--font-bodoni)] font-medium text-[34px] leading-none text-[#141016]">
          What are we<br />trying on today?
        </h1>
      </div>

      {/* Big CTA circle */}
      <div className="flex-1 flex items-center justify-center px-[20px] py-[26px] md:py-[16px]">
        <button
          onClick={() => router.push("/tryon/upload")}
          className="relative w-[208px] h-[208px] rounded-full border-none cursor-pointer flex flex-col items-center justify-center gap-[4px]"
          style={{
            background: "var(--lav)",
            boxShadow: "0 24px 50px -14px color-mix(in srgb, var(--lav) 75%, transparent)",
          }}
        >
          <span className="font-[family-name:var(--font-bodoni)] italic text-[38px] leading-none text-[#141016]">
            Try On
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[#141016] opacity-70">
            Start →
          </span>
        </button>
      </div>

      {/* Bottom quick links */}
      <div
        className="px-[20px] pb-[calc(22px+env(safe-area-inset-bottom))] flex gap-[12px]"
      >
        <button
          onClick={() => router.push("/wardrobe")}
          className="flex-1 box-border p-[16px] rounded-[16px] bg-white text-left cursor-pointer"
          style={{ border: "1px solid var(--lime)" }}
        >
          <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] uppercase text-[#9A9298]">
            04
          </div>
          <div className="font-[family-name:var(--font-grotesk)] font-semibold text-[14px] text-[#141016] mt-[6px]">
            My Wardrobe
          </div>
        </button>
        <button
          onClick={() => router.push("/color-analysis")}
          className="flex-1 box-border p-[16px] rounded-[16px] bg-white text-left cursor-pointer"
          style={{ border: "1px solid var(--lime)" }}
        >
          <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] uppercase text-[#9A9298]">
            06
          </div>
          <div className="font-[family-name:var(--font-grotesk)] font-semibold text-[14px] text-[#141016] mt-[6px]">
            Color Analysis
          </div>
        </button>
      </div>
    </section>
  );
}
