"use client";

import { useRouter } from "next/navigation";

export function SuccessScreen() {
  const router = useRouter();

  return (
    <section className="min-h-full flex flex-col items-center justify-center px-[30px] pb-[calc(30px+env(safe-area-inset-bottom))] box-border text-center animate-fade">
      <div
        className="w-[84px] h-[84px] rounded-full flex items-center justify-center text-[#141016] text-[38px] leading-none"
        style={{ background: "var(--lime)" }}
      >
        ✓
      </div>
      <span className="mt-[24px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
        Account created
      </span>
      <h1 className="mt-[10px] mb-[8px] font-[family-name:var(--font-bodoni)] font-medium text-[42px] leading-[0.98] text-[#141016]">
        You&apos;re in.
      </h1>
      <p className="m-0 font-[family-name:var(--font-grotesk)] text-[15px] leading-[1.5] text-[#6B6470] max-w-[280px]">
        Welcome to TryOn. Your personal fitting room is ready — let&apos;s dress you.
      </p>
      <button
        onClick={() => router.push("/home")}
        className="w-full box-border py-[17px] mt-[34px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
        style={{ background: "var(--lav)" }}
      >
        Enter TryOn →
      </button>
    </section>
  );
}
