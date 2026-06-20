"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MEASURE_FIELDS } from "@/lib/types";
import { Input } from "@/components/ui/Input";

export function ProfileSetupScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = params.get("ctx") ?? "reg";

  function finish() {
    router.push(ctx === "reg" ? "/success" : "/home");
  }

  function skip() {
    router.push(ctx === "reg" ? "/success" : "/home");
  }

  return (
    <section className="min-h-full flex flex-col px-[22px] pt-[24px] pb-[calc(24px+env(safe-area-inset-bottom))] box-border animate-fade">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#141016]">
        Optional · for better accuracy
      </span>
      <h1 className="mt-[8px] mb-[6px] font-[family-name:var(--font-bodoni)] font-medium text-[38px] leading-[0.98] text-[#141016]">
        Your<br />measurements
      </h1>
      <p className="m-0 mb-[20px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.5] text-[#6B6470]">
        The more we know, the sharper the fit and size advice. You can always skip and add these later.
      </p>

      <div className="grid grid-cols-2 gap-[14px]">
        {MEASURE_FIELDS.map((f) => (
          <Input
            key={f.label}
            label={f.label}
            placeholder={f.ph}
            unit={f.unit || undefined}
          />
        ))}
      </div>

      <div className="flex-1 min-h-[24px]" />

      <button
        onClick={finish}
        className="w-full box-border py-[17px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
        style={{ background: "var(--lav)" }}
      >
        Save profile
      </button>
      <button
        onClick={skip}
        className="w-full box-border py-[14px] mt-[8px] border-none bg-none font-[family-name:var(--font-mono)] text-[12px] tracking-[0.1em] uppercase text-[#9A9298] cursor-pointer"
      >
        {ctx === "reg" ? "Skip for now" : "Back to home"}
      </button>
    </section>
  );
}
