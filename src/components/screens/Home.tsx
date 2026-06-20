"use client";

import { useRouter } from "next/navigation";

export function HomeScreen() {
  const router = useRouter();

  return (
    <section className="min-h-full flex flex-col animate-fade">
      {/* Banner */}
      <div className="px-[20px] pt-[18px]">
        <div className="relative h-[200px] rounded-[18px] overflow-hidden hatch border border-[rgba(20,16,22,0.08)]">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] text-[#8C7F92]">
            [ HOW TRYON WORKS ]
          </span>
          <div className="absolute left-[16px] bottom-[16px] right-[16px] flex justify-between font-[family-name:var(--font-mono)] text-[10px] tracking-[0.08em] text-[#C8EA75]">
            <span>01 PHOTO</span>
            <span>02 OUTFIT</span>
            <span>03 VERDICT</span>
          </div>
        </div>
      </div>

      {/* Heading */}
      <div className="px-[20px] pt-[26px] text-center">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
          Ready when you are
        </span>
        <h1 className="mt-[8px] mb-0 font-[family-name:var(--font-bodoni)] font-medium text-[34px] leading-none text-[#141016]">
          What are we<br />trying on today?
        </h1>
      </div>

      {/* Big CTA circle */}
      <div className="flex-1 flex items-center justify-center px-[20px] py-[26px]">
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
