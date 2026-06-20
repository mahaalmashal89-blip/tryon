"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResultsVariant, STYLING_TIPS } from "@/lib/types";
import { MiniTab } from "@/components/ui/TabBar";
import { ScoreCircle } from "@/components/ui/ScoreCircle";

const SCORE = 87;

export function ResultsScreen() {
  const router = useRouter();
  const [variant, setVariant] = useState<ResultsVariant>("a");

  return (
    <section className="min-h-full flex flex-col animate-fade">
      <div className="px-[20px] pt-[18px]">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
          AI Stylist Report
        </span>
      </div>

      {/* Try-on preview */}
      <div className="px-[20px] pt-[10px]">
        <div className="relative h-[380px] rounded-[20px] overflow-hidden hatch border border-[rgba(20,16,22,0.08)]">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[#8C7F92] text-center">
            [ AI-GENERATED TRY-ON ]<br />your full look, styled
          </span>
          <span className="absolute top-[14px] left-[14px] font-[family-name:var(--font-mono)] text-[9px] tracking-[0.16em] uppercase text-white bg-[rgba(20,16,22,0.7)] px-[9px] py-[5px] rounded-full">
            ✦ AI Preview
          </span>
          <ScoreCircle score={SCORE} />
        </div>
      </div>

      {/* Variant A — Report card */}
      {variant === "a" && (
        <div className="px-[20px] pt-[22px]">
          <h1 className="m-0 mb-[16px] font-[family-name:var(--font-bodoni)] font-medium text-[30px] leading-none text-[#141016]">
            The verdict
          </h1>
          <div className="flex flex-col">
            <div className="flex justify-between items-baseline py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Color match</span>
              <span className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">Strong · warm undertone</span>
            </div>
            <div className="flex justify-between items-baseline py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Size advice</span>
              <span className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">True to size · M</span>
            </div>
            <div className="py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Styling tips</span>
              <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
                {STYLING_TIPS.map((text, i) => (
                  <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#141016] pt-[2px]">0{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Variant B — Magazine */}
      {variant === "b" && (
        <div className="px-[20px] pt-[22px]">
          <div className="flex items-end gap-[14px] pb-[18px]" style={{ borderBottom: "1px solid rgba(20,16,22,0.1)" }}>
            <span className="font-[family-name:var(--font-bodoni)] font-semibold text-[84px] leading-[0.8] tracking-[-0.02em] text-[#141016]">
              {SCORE}
            </span>
            <div className="pb-[8px]">
              <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Out of 100</div>
              <div
                className="inline-block mt-[5px] px-[10px] py-[3px] rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[13px] text-[#141016]"
                style={{ background: "var(--lime)" }}
              >
                A standout on you
              </div>
            </div>
          </div>
          <div className="flex gap-[12px] mt-[18px]">
            {[["Color", "Strong"], ["Size", "True · M"]].map(([label, val]) => (
              <div key={label} className="flex-1 border border-[rgba(20,16,22,0.1)] rounded-[14px] p-[14px]">
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298]">{label}</div>
                <div className="font-[family-name:var(--font-bodoni)] text-[19px] text-[#141016] mt-[4px]">{val}</div>
              </div>
            ))}
          </div>
          <div className="mt-[18px]">
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Styling notes</span>
            <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
              {STYLING_TIPS.map((text, i) => (
                <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#141016] pt-[2px]">0{i + 1}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Buy banner */}
      <div className="px-[20px] pt-[22px]">
        <div className="flex items-center gap-[14px] p-[18px] rounded-[18px] bg-[#141016]">
          <div
            className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-[22px] text-[#141016]"
            style={{ background: "var(--lime)" }}
          >
            ✓
          </div>
          <div>
            <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[24px] leading-none text-white">
              Worth buying
            </div>
            <div className="font-[family-name:var(--font-grotesk)] text-[13px] text-[rgba(255,255,255,0.7)] mt-[3px]">
              Flatters your shape, colour and palette.
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-[20px] pt-[16px] pb-[calc(22px+env(safe-area-inset-bottom))] flex gap-[10px] items-center">
        <button
          onClick={() => router.push("/wardrobe")}
          className="flex-1 py-[16px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[14px] text-[#141016] cursor-pointer"
          style={{ background: "var(--lav)" }}
        >
          Save to wardrobe
        </button>
        <button
          onClick={() => router.push("/tryon/upload")}
          className="py-[16px] px-[18px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white font-[family-name:var(--font-grotesk)] font-medium text-[14px] text-[#141016] cursor-pointer whitespace-nowrap"
        >
          Try another
        </button>
        <MiniTab
          labels={["A", "B"]}
          active={variant.toUpperCase()}
          onChange={(v) => setVariant(v.toLowerCase() as ResultsVariant)}
        />
      </div>
    </section>
  );
}
