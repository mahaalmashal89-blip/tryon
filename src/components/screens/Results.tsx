"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResultsVariant } from "@/lib/types";
import { MiniTab } from "@/components/ui/TabBar";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { tryonSession } from "@/lib/tryonSession";
import { saveTryonSession } from "@/lib/tryonStore";
import { useStyleReport } from "@/hooks/useStyleReport";
import type { StyleReport } from "@/lib/types";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-[8px] bg-[#F2EEEC] animate-pulse ${className ?? ""}`} />
  );
}

const CONFIDENCE_STYLES: Record<StyleReport["confidence"], { label: string; color: string }> = {
  high:   { label: "High confidence",   color: "#6B9E6B" },
  medium: { label: "Medium confidence", color: "#B08A3E" },
  low:    { label: "Low confidence",    color: "#9A7070" },
};

function ConfidenceBadge({ report, loading }: { report: StyleReport | null; loading: boolean }) {
  if (loading || !report) return null;
  const { label, color } = CONFIDENCE_STYLES[report.confidence];
  return (
    <span
      title={report.confidence_reason ?? undefined}
      className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em] uppercase"
      style={{ color }}
    >
      · {label}
    </span>
  );
}

export function ResultsScreen() {
  const router = useRouter();
  const [variant, setVariant]         = useState<ResultsVariant>("a");
  const [mounted, setMounted]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);

  const resultUrl = mounted ? tryonSession.getResult() : null;
  const { report, reportState } = useStyleReport(resultUrl);

  useEffect(() => { setMounted(true); }, []);

  const score     = report?.score ?? null;
  const isLoading = reportState === "loading" || reportState === "idle";

  async function handleDownload() {
    if (!resultUrl || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/tryon/download?url=${encodeURIComponent(resultUrl)}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "tryon-result.jpg";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  }

  async function handleSaveLater() {
    if (!resultUrl || saved || saving) return;
    setSaving(true);
    try {
      await saveTryonSession(tryonSession.getGarments(), resultUrl);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const imagePanel = (
    <div className="relative rounded-[20px] overflow-hidden border border-[rgba(20,16,22,0.08)] bg-white h-[380px] md:h-full md:min-h-[560px]">
      {resultUrl ? (
        <img
          src={resultUrl}
          alt="AI-generated try-on result"
          className="absolute inset-0 w-full h-full object-contain object-center"
          style={{ background: "#fff" }}
        />
      ) : (
        <>
          <div className="hatch absolute inset-0" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[#8C7F92] text-center">
            [ AI-GENERATED TRY-ON ]<br />your full look, styled
          </span>
        </>
      )}
      <span className="absolute top-[14px] left-[14px] font-[family-name:var(--font-mono)] text-[9px] tracking-[0.16em] uppercase text-white bg-[rgba(20,16,22,0.7)] px-[9px] py-[5px] rounded-full">
        ✦ AI Preview
      </span>
      <ScoreCircle score={score} loading={isLoading} />
    </div>
  );

  // Derived display values
  const colorMatchText = report
    ? `${report.color_match.rating} · ${report.color_match.palette_type}`
    : null;

  const styleText          = report?.style_category ?? null;
  const tips               = report?.styling_tips ?? [];
  const colorRecs          = report?.color_recommendations ?? [];
  const seasonalPalette    = report?.color_match.seasonal_palette ?? null;
  const seasonalReason     = report?.color_match.seasonal_palette_reason ?? null;

  const verdictContent = (
    <>
      {/* ── Variant A ── */}
      {variant === "a" && (
        <div>
          <h1 className="m-0 mb-[16px] font-[family-name:var(--font-bodoni)] font-medium text-[30px] leading-none text-[#141016]">
            The verdict
          </h1>
          <div className="flex flex-col">

            {/* Color match */}
            <div className="flex justify-between items-baseline py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Color match</span>
              {isLoading ? (
                <Skeleton className="h-[22px] w-[180px]" />
              ) : (
                <span className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">
                  {colorMatchText ?? "—"}
                </span>
              )}
            </div>

            {/* Seasonal palette */}
            <div className="py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <div className="flex justify-between items-baseline">
                <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Seasonal palette</span>
                {isLoading ? (
                  <Skeleton className="h-[22px] w-[140px]" />
                ) : (
                  <span className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">
                    {seasonalPalette ?? "—"}
                  </span>
                )}
              </div>
              {!isLoading && seasonalReason && (
                <p className="m-0 mt-[6px] font-[family-name:var(--font-grotesk)] text-[12px] leading-[1.5] text-[#9A9298] text-right">
                  {seasonalReason}
                </p>
              )}
            </div>

            {/* Style */}
            <div className="flex justify-between items-baseline py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Style</span>
              {isLoading ? (
                <Skeleton className="h-[22px] w-[120px]" />
              ) : (
                <span className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">
                  {styleText ?? "—"}
                </span>
              )}
            </div>

            {/* Styling tips */}
            <div className="py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Styling tips</span>
              {isLoading ? (
                <div className="mt-[12px] flex flex-col gap-[10px]">
                  <Skeleton className="h-[18px] w-full" />
                  <Skeleton className="h-[18px] w-[85%]" />
                </div>
              ) : tips.length > 0 ? (
                <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
                  {tips.map((text, i) => (
                    <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#141016] pt-[2px]">0{i + 1}</span>
                      {text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-[12px] font-[family-name:var(--font-grotesk)] text-[13px] text-[#9A9298]">
                  Tips unavailable — generate a new look to retry.
                </p>
              )}
            </div>

            {/* Color recommendations */}
            <div className="py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Color picks for next time</span>
              {isLoading ? (
                <div className="mt-[12px] flex flex-col gap-[10px]">
                  <Skeleton className="h-[18px] w-full" />
                  <Skeleton className="h-[18px] w-[80%]" />
                </div>
              ) : colorRecs.length > 0 ? (
                <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
                  {colorRecs.map((text, i) => (
                    <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#9A9298] pt-[2px]">→</span>
                      {text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* ── Variant B ── */}
      {variant === "b" && (
        <div>
          <div className="flex items-end gap-[14px] pb-[18px]" style={{ borderBottom: "1px solid rgba(20,16,22,0.1)" }}>
            {isLoading ? (
              <Skeleton className="h-[67px] w-[100px]" />
            ) : (
              <span className="font-[family-name:var(--font-bodoni)] font-semibold text-[84px] leading-[0.8] tracking-[-0.02em] text-[#141016]">
                {score ?? "—"}
              </span>
            )}
            <div className="pb-[8px]">
              <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Out of 100</div>
              {isLoading ? (
                <Skeleton className="mt-[5px] h-[24px] w-[120px] rounded-full" />
              ) : report ? (
                <div
                  className="inline-block mt-[5px] px-[10px] py-[3px] rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[13px] text-[#141016]"
                  style={{ background: "var(--lime)" }}
                >
                  {report.score_reasoning.length > 40
                    ? report.score_reasoning.slice(0, 38) + "…"
                    : report.score_reasoning}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex gap-[12px] mt-[18px]">
            {isLoading ? (
              <>
                <Skeleton className="flex-1 h-[70px] rounded-[14px]" />
                <Skeleton className="flex-1 h-[70px] rounded-[14px]" />
                <Skeleton className="flex-1 h-[70px] rounded-[14px]" />
              </>
            ) : (
              [
                ["Color",   report?.color_match.rating  ?? "—"],
                ["Palette", seasonalPalette              ?? "—"],
                ["Style",   report?.style_category       ?? "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex-1 border border-[rgba(20,16,22,0.1)] rounded-[14px] p-[14px]">
                  <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298]">{label}</div>
                  <div className="font-[family-name:var(--font-bodoni)] text-[16px] text-[#141016] mt-[4px] leading-tight">{val}</div>
                </div>
              ))
            )}
          </div>

          <div className="mt-[18px]">
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Styling notes</span>
            {isLoading ? (
              <div className="mt-[12px] flex flex-col gap-[10px]">
                <Skeleton className="h-[18px] w-full" />
                <Skeleton className="h-[18px] w-[85%]" />
              </div>
            ) : tips.length > 0 ? (
              <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
                {tips.map((text, i) => (
                  <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#141016] pt-[2px]">0{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-[12px] font-[family-name:var(--font-grotesk)] text-[13px] text-[#9A9298]">
                Styling notes unavailable.
              </p>
            )}
          </div>

          {!isLoading && colorRecs.length > 0 && (
            <div className="mt-[18px]">
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Color picks for next time</span>
              <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
                {colorRecs.map((text, i) => (
                  <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#9A9298] pt-[2px]">→</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Buy banner ── */}
      {isLoading ? (
        <div className="mt-[22px]">
          <Skeleton className="h-[84px] rounded-[18px]" />
        </div>
      ) : (
        <div className="mt-[22px]">
          {report ? (
            <div className="flex items-center gap-[14px] p-[18px] rounded-[18px] bg-[#141016]">
              <div
                className="w-[48px] h-[48px] flex-none rounded-full flex items-center justify-center text-[22px] text-[#141016]"
                style={{ background: report.worth_buying.verdict ? "var(--lime)" : "#9A9298" }}
              >
                {report.worth_buying.verdict ? "✓" : "×"}
              </div>
              <div>
                <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[24px] leading-none text-white">
                  {report.worth_buying.label}
                </div>
                <div className="font-[family-name:var(--font-grotesk)] text-[13px] text-[rgba(255,255,255,0.7)] mt-[3px]">
                  {report.worth_buying.reasoning}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-[14px] p-[18px] rounded-[18px] bg-[#F2EEEC]">
              <div className="font-[family-name:var(--font-grotesk)] text-[13px] text-[#9A9298]">
                Style analysis couldn&apos;t be completed. Generate a new look to retry.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="mt-[16px] pb-[calc(22px+env(safe-area-inset-bottom))] md:pb-[22px] flex flex-col gap-[10px]">
        <div className="flex gap-[10px]">
          <button
            onClick={handleDownload}
            disabled={!resultUrl || downloading}
            className="flex-1 py-[16px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[14px] text-[#141016] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--lav)" }}
          >
            {downloading ? "Downloading…" : "↓ Download"}
          </button>
          <button
            onClick={handleSaveLater}
            disabled={!resultUrl || saved || saving}
            className="flex-1 py-[16px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white font-[family-name:var(--font-grotesk)] font-medium text-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ color: saved ? "#6B6470" : "#141016" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved 30 days" : "Save for 30 days"}
          </button>
        </div>

        <div className="flex gap-[10px] items-center">
          <button
            onClick={() => router.push("/tryon/upload")}
            className="flex-1 py-[14px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white font-[family-name:var(--font-grotesk)] font-medium text-[14px] text-[#141016] cursor-pointer"
          >
            Generate again
          </button>
          <MiniTab
            labels={["A", "B"]}
            active={variant.toUpperCase()}
            onChange={(v) => setVariant(v.toLowerCase() as ResultsVariant)}
          />
        </div>

        <p className="m-0 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#B6ADA8]">
          Your photo is never stored · Zero Data Retention
        </p>
      </div>
    </>
  );

  return (
    <section className="min-h-full animate-fade">

      {/* ── MOBILE layout ── */}
      <div className="flex flex-col md:hidden">
        <div className="px-[20px] pt-[18px] flex items-center gap-[10px]">
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
            AI Stylist Report
          </span>
          <ConfidenceBadge report={report} loading={isLoading} />
        </div>
        <div className="px-[20px] pt-[10px]">{imagePanel}</div>
        <div className="px-[20px] pt-[22px]">{verdictContent}</div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:grid md:grid-cols-[55%_1fr] md:min-h-full md:px-[40px] md:py-[40px] md:gap-[40px]">
        <div className="md:sticky md:top-[40px] md:self-start">
          <div className="flex items-center gap-[10px] mb-[16px]">
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
              AI Stylist Report
            </span>
            <ConfidenceBadge report={report} loading={isLoading} />
          </div>
          {imagePanel}
        </div>
        <div>{verdictContent}</div>
      </div>

    </section>
  );
}
