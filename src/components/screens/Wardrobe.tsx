import { WARDROBE_MOCK } from "@/lib/types";

const VERDICT_STYLES: Record<string, { bg: string; fg: string }> = {
  BUY:   { bg: "var(--lime)",                                       fg: "#141016" },
  MAYBE: { bg: "color-mix(in srgb, var(--lav) 45%, #fff)",          fg: "#141016" },
  SKIP:  { bg: "#F2EEEC",                                           fg: "#9A9298" },
};

export function WardrobeScreen() {
  return (
    <section className="min-h-full px-[20px] pt-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] box-border animate-fade">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
        05 · My Wardrobe
      </span>
      <h1 className="mt-[8px] mb-[18px] font-[family-name:var(--font-bodoni)] font-medium text-[38px] leading-[0.98] text-[#141016]">
        History
      </h1>
      <div className="flex flex-col gap-[12px]">
        {WARDROBE_MOCK.map((w) => {
          const v = VERDICT_STYLES[w.verdict];
          return (
            <div
              key={w.id}
              className="flex gap-[14px] items-center p-[12px] border border-[rgba(20,16,22,0.1)] rounded-[16px]"
            >
              <div className="relative w-[64px] h-[80px] flex-none rounded-[11px] overflow-hidden hatch border border-[rgba(20,16,22,0.06)]" />
              <div className="flex-1 min-w-0">
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298]">
                  {w.src}
                </div>
                <div className="font-[family-name:var(--font-bodoni)] text-[21px] text-[#141016] mt-[2px]">
                  {w.type}
                </div>
                <span
                  className="inline-block mt-[7px] px-[10px] py-[3px] rounded-full font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em]"
                  style={{ background: v.bg, color: v.fg }}
                >
                  {w.verdict}
                </span>
              </div>
              <div className="text-right flex-none">
                <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[26px] leading-none text-[#141016]">
                  {w.score}
                </div>
                <div className="font-[family-name:var(--font-mono)] text-[9px] text-[#9A9298]">
                  /100
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
