"use client";

import { useAnalyzeTimer } from "@/hooks/useAnalyzeTimer";
import { ANALYZE_STEPS } from "@/lib/types";

export function AnalyzingScreen() {
  const step = useAnalyzeTimer();

  return (
    <section className="min-h-full flex flex-col justify-center px-[30px] py-[40px] box-border animate-fade">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[#141016]">
        AI Stylist · working
      </span>
      <h1 className="mt-[10px] mb-[26px] font-[family-name:var(--font-bodoni)] font-medium italic text-[40px] leading-none text-[#141016]">
        Dressing<br />you up…
      </h1>

      {/* Progress bar */}
      <div className="h-[6px] rounded-full bg-[#F2EEEC] overflow-hidden">
        <div className="h-full w-[60%] rounded-full shimmer-bar" />
      </div>

      {/* Steps */}
      <div className="mt-[26px] flex flex-col gap-[14px]">
        {ANALYZE_STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex items-center gap-[12px]">
              <span
                className="w-[20px] h-[20px] flex-none rounded-full flex items-center justify-center text-[11px] text-[#141016] transition-all duration-300"
                style={{
                  background: done
                    ? "var(--lime)"
                    : active
                    ? "#fff"
                    : "#F2EEEC",
                  border: active ? "2px solid var(--lav)" : "none",
                  animation: active ? "scPulse 1s ease infinite" : "none",
                }}
              >
                {done ? "✓" : ""}
              </span>
              <span
                className="font-[family-name:var(--font-grotesk)] text-[14px] transition-all duration-300"
                style={{
                  color: done || active ? "#141016" : "#C3BBB6",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
