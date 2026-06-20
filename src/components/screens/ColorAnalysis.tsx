import { GOOD_COLORS, BAD_COLORS } from "@/lib/types";

export function ColorAnalysisScreen() {
  return (
    <section className="min-h-full px-[20px] pt-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] box-border animate-fade">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
        06 · Color Analysis
      </span>
      <h1 className="mt-[8px] mb-0 font-[family-name:var(--font-bodoni)] font-medium text-[38px] leading-[0.96] text-[#141016]">
        Bright<br /><em>Spring</em>
      </h1>

      <div className="flex gap-[12px] mt-[18px]">
        {[["Undertone", "Warm"], ["Contrast", "High · clear"]].map(([label, val]) => (
          <div key={label} className="flex-1 border border-[rgba(20,16,22,0.1)] rounded-[14px] p-[14px]">
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298]">
              {label}
            </div>
            <div className="font-[family-name:var(--font-bodoni)] text-[20px] text-[#141016] mt-[4px]">
              {val}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-[18px] mb-0 font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.55] text-[#6B6470]">
        Your warm, clear undertone glows in saturated, sun-warmed hues. Skip muted, dusty tones — they flatten your natural contrast.
      </p>

      {/* Good colors */}
      <div className="mt-[22px]">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#141016]">
          Your colors
        </span>
        <div className="flex flex-wrap gap-[10px] mt-[12px]">
          {GOOD_COLORS.map((c) => (
            <div key={c.name} className="text-center">
              <div
                className="w-[54px] h-[54px] rounded-[14px] border border-[rgba(20,16,22,0.08)]"
                style={{ background: c.hex }}
              />
              <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.04em] text-[#6B6470] mt-[6px]">
                {c.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bad colors */}
      <div className="mt-[24px]">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">
          Colors to avoid
        </span>
        <div className="flex flex-wrap gap-[10px] mt-[12px]">
          {BAD_COLORS.map((c) => (
            <div key={c.name} className="text-center opacity-85">
              <div
                className="relative w-[54px] h-[54px] rounded-[14px] border border-[rgba(20,16,22,0.08)]"
                style={{ background: c.hex }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[rgba(255,255,255,0.9)] text-[20px]">
                  ⁄
                </span>
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.04em] text-[#9A9298] mt-[6px]">
                {c.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation box */}
      <div
        className="mt-[26px] p-[18px] rounded-[16px]"
        style={{
          background: "color-mix(in srgb, var(--lav) 28%, #fff)",
          border: "1px solid color-mix(in srgb, var(--lav) 50%, #fff)",
        }}
      >
        <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] uppercase text-[#141016]">
          Recommendation
        </div>
        <p className="mt-[8px] mb-0 font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.5] text-[#141016]">
          Build outfits around coral and marigold as your heroes, ground them with ivory, and use cobalt as a sharp accent. Gold jewellery over silver.
        </p>
      </div>
    </section>
  );
}
