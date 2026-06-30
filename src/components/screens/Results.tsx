"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResultsVariant } from "@/lib/types";
import { MiniTab } from "@/components/ui/TabBar";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { tryonSession } from "@/lib/tryonSession";
import { saveTryonSession } from "@/lib/tryonStore";
import { useStyleReport, type ReportState } from "@/hooks/useStyleReport";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import type { StyleReport, DualReport } from "@/lib/types";

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    reportLabel:    "AI Stylist Report",
    pageTitle:      "Style Analysis",
    confidence:     { high: "High confidence", medium: "Medium confidence", low: "Low confidence" },
    score:          "Score",
    scoreSheet:     "Score Breakdown",
    colorMatch:     "Color Match",
    colorSheet:     "Color Analysis",
    palette:        "Personal Color Analysis",
    paletteSheet:   "Personal Color Analysis",
    colorTypeLabel: "Color Type",
    colorWhy:       "Why",
    outfitAdvice:   "Outfit Color Advice",
    bestColors:     "Color picks for next time",
    style:          "Style",
    tips:           "Styling Tips",
    colorPicks:     "Color Picks for Next Time",
    buySheet:       "Shopping Verdict",
    generate:       "Generate again",
    download:       "↓ Download",
    save:           "Save for 30 days",
    saveWaiting:    "Generating report…",
    saving:         "Saving…",
    saved:          "✓ Saved 30 days",
    downloading:    "Downloading…",
    zdr:            "Your photo is never stored · Zero Data Retention",
    backToWardrobe: "← Wardrobe",
    tapDetails:     "Tap for details",
    unavailable:    "Style analysis couldn't be completed. Generate a new look to retry.",
    tipsNone:       "Tips unavailable — generate a new look to retry.",
    notesNone:      "Styling notes unavailable.",
    stylingNotes:   "Styling Notes",
    scoreLabels: {
      color_harmony:     "Color Harmony",
      outfit_cohesion:   "Outfit Cohesion",
      layering:          "Layering & Structure",
      visual_balance:    "Visual Balance",
      style_suitability: "Style Suitability",
    },
    outOf: "out of",
    totalScore: "Total Score",
  },
  ar: {
    reportLabel:    "تقرير المصممة الذكية",
    pageTitle:      "تحليل الإطلالة",
    confidence:     { high: "ثقة عالية", medium: "ثقة متوسطة", low: "ثقة منخفضة" },
    score:          "النقاط",
    scoreSheet:     "تفصيل النقاط",
    colorMatch:     "تناسق الألوان",
    colorSheet:     "تحليل الألوان",
    palette:        "تحليل لونك الشخصي",
    paletteSheet:   "تحليل لونك الشخصي",
    colorTypeLabel: "نوع اللون",
    colorWhy:       "السبب",
    outfitAdvice:   "نصيحة لإطلالتك",
    bestColors:     "الألوان المقترحة للمرة القادمة",
    style:          "الأسلوب",
    tips:           "نصائح التنسيق",
    colorPicks:     "الألوان المقترحة للمرة القادمة",
    buySheet:       "قرار الشراء",
    generate:       "توليد مجدداً",
    download:       "↓ تنزيل",
    save:           "حفظ لمدة ٣٠ يوماً",
    saveWaiting:    "جارٍ توليد التقرير…",
    saving:         "جارٍ الحفظ…",
    saved:          "✓ تم الحفظ",
    downloading:    "جارٍ التنزيل…",
    zdr:            "صورتك لا تُحفظ أبداً · صفر احتفاظ بالبيانات",
    backToWardrobe: "← الخزانة",
    tapDetails:     "اضغطي للتفاصيل",
    unavailable:    "لم يتمكن التحليل من الاكتمال. جربي إطلالة جديدة.",
    tipsNone:       "النصائح غير متاحة — جربي إطلالة جديدة.",
    notesNone:      "ملاحظات التنسيق غير متاحة.",
    stylingNotes:   "ملاحظات التنسيق",
    scoreLabels: {
      color_harmony:     "تناسق الألوان",
      outfit_cohesion:   "تناسق القطع",
      layering:          "التطبيق والبنية",
      visual_balance:    "التوازن البصري",
      style_suitability: "ملاءمة الأسلوب",
    },
    outOf: "من",
    totalScore: "المجموع",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-[8px] bg-[#F2EEEC] animate-pulse ${className ?? ""}`} />;
}

const CONFIDENCE_STYLES: Record<StyleReport["confidence"], { color: string }> = {
  high:   { color: "#6B9E6B" },
  medium: { color: "#B08A3E" },
  low:    { color: "#9A7070" },
};

const VERDICT_DISPLAY: Record<StyleReport["worth_buying"]["verdict"], { bg: string; icon: string }> = {
  worth_it: { bg: "var(--lime)", icon: "✓" },
  maybe:    { bg: "var(--lav)",  icon: "~" },
  skip:     { bg: "#9A9298",    icon: "×" },
};

function ConfidenceBadge({ report, loading, lang }: { report: StyleReport | null; loading: boolean; lang: Language }) {
  if (loading || !report) return null;
  const { color } = CONFIDENCE_STYLES[report.confidence];
  const label = T[lang].confidence[report.confidence];
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

function Chevron() {
  return (
    <span className="font-[family-name:var(--font-grotesk)] text-[16px] text-[#C8C2CC] leading-none flex-none">›</span>
  );
}

function ScoreBar({ label, score, note, max = 20 }: { label: string; score: number; note?: string; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 75 ? "var(--lime)" : pct >= 50 ? "#F4C87A" : "#E8928A";
  return (
    <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
      <div className="flex items-center gap-[12px] mb-[8px]">
        <span className="flex-1 font-[family-name:var(--font-grotesk)] text-[13px] text-[#6B6470]">{label}</span>
        <span className="font-[family-name:var(--font-bodoni)] text-[18px] text-[#141016]">{score}<span className="text-[12px] text-[#9A9298]">/{max}</span></span>
      </div>
      <div className="h-[6px] w-full rounded-full bg-[#F2EEEC] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      {note && (
        <p className="m-0 mt-[6px] font-[family-name:var(--font-grotesk)] text-[12px] leading-[1.5] text-[#9A9298]">{note}</p>
      )}
    </div>
  );
}

function LanguageToggle({ language, setLanguage }: { language: Language; setLanguage: (l: Language) => void }) {
  return (
    <div className="flex items-center gap-[2px] rounded-full border border-[rgba(20,16,22,0.12)] overflow-hidden">
      {(["en", "ar"] as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className="px-[10px] py-[5px] border-none cursor-pointer font-[family-name:var(--font-mono)] text-[10px] tracking-[0.06em] transition-colors"
          style={{
            background: language === lang ? "#141016" : "transparent",
            color: language === lang ? "#fff" : "#9A9298",
          }}
        >
          {lang === "en" ? "EN" : "عربية"}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ResultsScreenProps {
  savedResultUrl?: string | null;
  savedReport?: DualReport | null;
  onBack?: () => void;
}

export function ResultsScreen({ savedResultUrl, savedReport, onBack }: ResultsScreenProps = {}) {
  // MUST be before all useState calls — avoids TDZ ReferenceError
  const isSaved = savedResultUrl !== undefined;

  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [variant, setVariant]         = useState<ResultsVariant>("a");
  const [mounted, setMounted]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved]             = useState(isSaved);
  const [saving, setSaving]           = useState(false);

  // Bottom sheet states
  const [scoreOpen,   setScoreOpen]   = useState(false);
  const [colorOpen,   setColorOpen]   = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [buyOpen,     setBuyOpen]     = useState(false);

  // In saved mode: resultUrl comes from props; never call the style-report API
  const liveResultUrl = mounted ? tryonSession.getResult() : null;
  const resultUrl = isSaved ? (savedResultUrl ?? null) : liveResultUrl;
  const { report: fetchedDualReport, reportState: fetchedReportState } = useStyleReport(isSaved ? null : resultUrl);
  const dualReport: DualReport | null = isSaved ? (savedReport ?? null) : fetchedDualReport;
  const reportState: ReportState = isSaved
    ? (savedReport != null ? "success" : "failed")
    : fetchedReportState;
  const report = dualReport?.[language] ?? null;

  useEffect(() => { setMounted(true); }, []);

  const score     = report?.score ?? null;
  const isLoading = reportState === "loading" || reportState === "idle";
  const t         = T[language];
  const dir       = language === "ar" ? "rtl" : "ltr";

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
      // Pass the full DualReport so it is persisted with the session.
      // If report failed (dualReport is null), save without it — graceful degradation.
      await saveTryonSession(tryonSession.getGarments(), resultUrl, dualReport);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  // ── Image panel ────────────────────────────────────────────────────────────
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
      {/* Tappable score circle */}
      <button
        onClick={() => report && setScoreOpen(true)}
        className="absolute bottom-[14px] right-[14px] border-none p-0 bg-transparent cursor-pointer"
        aria-label={t.scoreSheet}
        disabled={!report}
      >
        <ScoreCircle score={score} loading={isLoading} />
      </button>
    </div>
  );

  // ── Verdict content ────────────────────────────────────────────────────────
  const colorMatchText = report
    ? `${report.color_match.rating} · ${report.color_match.palette_type}`
    : null;
  const styleText       = report?.style_category ?? null;
  const tips            = report?.styling_tips ?? [];
  const colorRecs       = report?.color_recommendations ?? [];
  const personalColor = report?.personal_color_analysis ?? null;

  const verdictContent = (
    <>
      {/* ── Variant A ── */}
      {variant === "a" && (
        <div>
          {/* Page title — large editorial serif */}
          <h1 className="m-0 mb-[28px] font-[family-name:var(--font-bodoni)] font-medium text-[34px] leading-[1] tracking-[-0.01em] text-[#141016]">
            {t.pageTitle}
          </h1>

          <div className="flex flex-col">

            {/* ── Color Match — tappable row ── */}
            <button
              onClick={() => report && setColorOpen(true)}
              disabled={!report}
              className="flex justify-between items-center py-[20px] border-none bg-transparent cursor-pointer text-left w-full disabled:cursor-default group"
              style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}
            >
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">
                {t.colorMatch}
              </span>
              <div className="flex items-center gap-[10px]">
                {isLoading ? (
                  <Skeleton className="h-[20px] w-[170px]" />
                ) : (
                  <>
                    <span className="font-[family-name:var(--font-bodoni)] text-[20px] text-[#141016]">
                      {colorMatchText ?? "—"}
                    </span>
                    {report && <Chevron />}
                  </>
                )}
              </div>
            </button>

            {/* ── Personal Color Analysis — tappable row ── */}
            <button
              onClick={() => report && setPaletteOpen(true)}
              disabled={!report}
              className="flex justify-between items-center py-[20px] w-full border-none bg-transparent cursor-pointer text-left disabled:cursor-default"
              style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}
            >
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">
                {t.palette}
              </span>
              <div className="flex items-center gap-[10px]">
                {isLoading ? (
                  <Skeleton className="h-[20px] w-[130px]" />
                ) : (
                  <>
                    <span className="font-[family-name:var(--font-bodoni)] text-[20px] text-[#141016]">
                      {personalColor?.color_type ?? "—"}
                    </span>
                    {report && personalColor?.color_type && <Chevron />}
                  </>
                )}
              </div>
            </button>

            {/* ── Style — static row ── */}
            <div
              className="flex justify-between items-center py-[20px]"
              style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}
            >
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">
                {t.style}
              </span>
              {isLoading ? (
                <Skeleton className="h-[20px] w-[110px]" />
              ) : (
                <span className="font-[family-name:var(--font-bodoni)] text-[20px] text-[#141016]">
                  {styleText ?? "—"}
                </span>
              )}
            </div>

            {/* ── Styling Tips ── */}
            <div
              className="py-[20px]"
              style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}
            >
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">
                {t.tips}
              </span>
              {isLoading ? (
                <div className="mt-[14px] flex flex-col gap-[12px]">
                  <Skeleton className="h-[16px] w-full" />
                  <Skeleton className="h-[16px] w-[80%]" />
                </div>
              ) : tips.length > 0 ? (
                <ul className="m-0 mt-[14px] p-0 list-none flex flex-col gap-[14px]">
                  {tips.slice(0, 2).map((text, i) => (
                    <li key={i} className="flex gap-[14px] items-start">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.06em] text-[#C4BEC8] pt-[3px] flex-none w-[16px]">
                        0{i + 1}
                      </span>
                      <span className="font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.65] text-[#3A343C]">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-[12px] m-0 font-[family-name:var(--font-grotesk)] text-[13px] text-[#9A9298]">
                  {t.tipsNone}
                </p>
              )}
            </div>

            {/* ── Color Picks ── */}
            {(!isLoading && colorRecs.length > 0) && (
              <div
                className="py-[20px]"
                style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}
              >
                <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">
                  {t.colorPicks}
                </span>
                <ul className="m-0 mt-[14px] p-0 list-none flex flex-col gap-[12px]">
                  {colorRecs.map((text, i) => (
                    <li key={i} className="flex gap-[12px] items-start">
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#C4BEC8] pt-[3px] flex-none">→</span>
                      <span className="font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.65] text-[#3A343C]">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Variant B ── */}
      {variant === "b" && (
        <div>
          {/* Score header */}
          <div className="flex items-end gap-[14px] pb-[22px]" style={{ borderBottom: "1px solid rgba(20,16,22,0.08)" }}>
            {isLoading ? (
              <Skeleton className="h-[67px] w-[100px]" />
            ) : (
              <button
                onClick={() => report && setScoreOpen(true)}
                disabled={!report}
                className="border-none bg-transparent p-0 cursor-pointer disabled:cursor-default"
              >
                <span className="font-[family-name:var(--font-bodoni)] font-semibold text-[84px] leading-[0.85] tracking-[-0.03em] text-[#141016]">
                  {score ?? "—"}
                </span>
              </button>
            )}
            <div className="pb-[6px]">
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">{t.outOf} 100</div>
              {isLoading ? (
                <Skeleton className="mt-[6px] h-[22px] w-[120px] rounded-full" />
              ) : report ? (
                <div
                  className="inline-block mt-[6px] px-[10px] py-[4px] rounded-full font-[family-name:var(--font-grotesk)] text-[12px] text-[#141016]"
                  style={{ background: "var(--lime)" }}
                >
                  {report.score_reasoning.length > 44
                    ? report.score_reasoning.slice(0, 42) + "…"
                    : report.score_reasoning}
                </div>
              ) : null}
            </div>
          </div>

          {/* 3-card summary */}
          <div className="flex gap-[8px] mt-[20px]">
            {isLoading ? (
              <>
                <Skeleton className="flex-1 h-[72px] rounded-[14px]" />
                <Skeleton className="flex-1 h-[72px] rounded-[14px]" />
                <Skeleton className="flex-1 h-[72px] rounded-[14px]" />
              </>
            ) : (
              [
                { label: t.colorMatch, val: report?.color_match.rating ?? "—", action: () => report && setColorOpen(true) },
                { label: t.palette,    val: personalColor?.color_type ?? "—",    action: () => report && setPaletteOpen(true) },
                { label: t.style,      val: report?.style_category ?? "—",      action: undefined },
              ].map(({ label, val, action }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={!action || !report}
                  className="flex-1 border border-[rgba(20,16,22,0.08)] rounded-[14px] p-[14px] text-left bg-white cursor-pointer disabled:cursor-default"
                >
                  <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em] uppercase text-[#9A9298]">{label}</div>
                  <div className="font-[family-name:var(--font-bodoni)] text-[15px] text-[#141016] mt-[5px] leading-[1.2]">{val}</div>
                </button>
              ))
            )}
          </div>

          {/* Styling notes */}
          <div className="mt-[24px]">
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">{t.stylingNotes}</span>
            {isLoading ? (
              <div className="mt-[14px] flex flex-col gap-[12px]">
                <Skeleton className="h-[16px] w-full" />
                <Skeleton className="h-[16px] w-[80%]" />
              </div>
            ) : tips.length > 0 ? (
              <ul className="m-0 mt-[14px] p-0 list-none flex flex-col gap-[14px]">
                {tips.slice(0, 2).map((text, i) => (
                  <li key={i} className="flex gap-[14px] items-start">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.06em] text-[#C4BEC8] pt-[3px] flex-none w-[16px]">
                      0{i + 1}
                    </span>
                    <span className="font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.65] text-[#3A343C]">{text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-[12px] m-0 font-[family-name:var(--font-grotesk)] text-[13px] text-[#9A9298]">
                {t.notesNone}
              </p>
            )}
          </div>

          {/* Color picks */}
          {!isLoading && colorRecs.length > 0 && (
            <div className="mt-[24px]">
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298]">{t.colorPicks}</span>
              <ul className="m-0 mt-[14px] p-0 list-none flex flex-col gap-[12px]">
                {colorRecs.map((text, i) => (
                  <li key={i} className="flex gap-[12px] items-start">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#C4BEC8] pt-[3px] flex-none">→</span>
                    <span className="font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.65] text-[#3A343C]">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Buy banner — tappable ── */}
      {isLoading ? (
        <div className="mt-[22px]">
          <Skeleton className="h-[84px] rounded-[18px]" />
        </div>
      ) : (
        <div className="mt-[22px]">
          {report ? (
            <button
              onClick={() => setBuyOpen(true)}
              className="w-full flex items-center gap-[16px] px-[20px] py-[20px] rounded-[20px] bg-[#141016] border-none cursor-pointer text-left"
            >
              <div
                className="w-[44px] h-[44px] flex-none rounded-full flex items-center justify-center text-[18px] font-semibold text-[#141016]"
                style={{ background: VERDICT_DISPLAY[report.worth_buying.verdict]?.bg ?? "#9A9298" }}
              >
                {VERDICT_DISPLAY[report.worth_buying.verdict]?.icon ?? "×"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[26px] leading-[1] text-white tracking-[-0.01em]">
                  {report.worth_buying.label}
                </div>
                <div className="font-[family-name:var(--font-grotesk)] text-[12px] text-[rgba(255,255,255,0.38)] mt-[5px] leading-[1.5] truncate">
                  {report.worth_buying.reasoning}
                </div>
              </div>
              <span className="font-[family-name:var(--font-grotesk)] text-[18px] text-[rgba(255,255,255,0.25)] flex-none">›</span>
            </button>
          ) : (
            <div className="flex items-center gap-[14px] p-[18px] rounded-[18px] bg-[#F2EEEC]">
              <div className="font-[family-name:var(--font-grotesk)] text-[13px] text-[#9A9298]">
                {t.unavailable}
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
            {downloading ? t.downloading : t.download}
          </button>
          <button
            onClick={handleSaveLater}
            disabled={!resultUrl || saved || saving || isLoading}
            className="flex-1 py-[16px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white font-[family-name:var(--font-grotesk)] font-medium text-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ color: saved ? "#6B6470" : "#141016" }}
          >
            {isLoading ? t.saveWaiting : saving ? t.saving : saved ? t.saved : t.save}
          </button>
        </div>

        <div className="flex gap-[10px] items-center">
          {isSaved ? (
            <button
              onClick={onBack ?? (() => router.push("/wardrobe"))}
              className="flex-1 py-[14px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white font-[family-name:var(--font-grotesk)] font-medium text-[14px] text-[#141016] cursor-pointer"
            >
              {t.backToWardrobe}
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/tryon/upload")}
                className="flex-1 py-[14px] border border-[rgba(20,16,22,0.14)] rounded-full bg-white font-[family-name:var(--font-grotesk)] font-medium text-[14px] text-[#141016] cursor-pointer"
              >
                {t.generate}
              </button>
              <MiniTab
                labels={["A", "B"]}
                active={variant.toUpperCase()}
                onChange={(v) => setVariant(v.toLowerCase() as ResultsVariant)}
              />
            </>
          )}
        </div>

        {!isSaved && (
          <p className="m-0 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#B6ADA8]">
            {t.zdr}
          </p>
        )}
      </div>
    </>
  );

  // ── Bottom sheets ──────────────────────────────────────────────────────────
  const scoreSheet = (
    <BottomSheet open={scoreOpen} onClose={() => setScoreOpen(false)} title={t.scoreSheet} dir={dir}>
      {report && (
        <>
          <div className="flex items-baseline gap-[10px] mb-[4px]">
            <span className="font-[family-name:var(--font-bodoni)] font-semibold text-[64px] leading-none text-[#141016]">
              {report.score}
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[13px] text-[#9A9298]">/ 100</span>
          </div>
          <p className="m-0 mb-[20px] font-[family-name:var(--font-grotesk)] text-[14px] text-[#6B6470] leading-[1.5]">
            {report.score_reasoning}
          </p>
          {(Object.keys(t.scoreLabels) as Array<keyof typeof t.scoreLabels>).map((key) => (
            <ScoreBar
              key={key}
              label={t.scoreLabels[key]}
              score={report.score_breakdown[key]}
              note={report.score_notes?.[key]}
            />
          ))}
        </>
      )}
    </BottomSheet>
  );

  const colorSheet = (
    <BottomSheet open={colorOpen} onClose={() => setColorOpen(false)} title={t.colorSheet} dir={dir}>
      {report && (
        <div className="flex flex-col gap-[18px]">
          <div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298] mb-[6px]">{t.colorMatch}</div>
            <div className="font-[family-name:var(--font-bodoni)] text-[26px] text-[#141016]">{colorMatchText}</div>
            <p className="m-0 mt-[8px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.6] text-[#3A343C]">{report.color_match.detail}</p>
          </div>
          <div style={{ borderTop: "1px solid rgba(20,16,22,0.08)", paddingTop: "18px" }}>
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298] mb-[6px]">{t.style}</div>
            <div className="font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.6] text-[#3A343C]">{report.outfit_cohesion.detail}</div>
          </div>
        </div>
      )}
    </BottomSheet>
  );

  const paletteSheet = (
    <BottomSheet open={paletteOpen} onClose={() => setPaletteOpen(false)} title={t.paletteSheet} dir={dir}>
      {report && personalColor && (
        <div className="flex flex-col gap-[18px]">
          <div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298] mb-[8px]">{t.colorTypeLabel}</div>
            <div className="font-[family-name:var(--font-bodoni)] text-[28px] text-[#141016] mb-[8px]">
              {personalColor.color_type}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(20,16,22,0.08)", paddingTop: "18px" }}>
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298] mb-[8px]">{t.colorWhy}</div>
            <p className="m-0 font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.6] text-[#3A343C]">{personalColor.reason}</p>
          </div>
          <div style={{ borderTop: "1px solid rgba(20,16,22,0.08)", paddingTop: "18px" }}>
            <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298] mb-[8px]">{t.outfitAdvice}</div>
            <p className="m-0 font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.6] text-[#3A343C]">{personalColor.outfit_advice}</p>
          </div>
        </div>
      )}
    </BottomSheet>
  );

  const buySheet = (
    <BottomSheet open={buyOpen} onClose={() => setBuyOpen(false)} title={t.buySheet} dir={dir}>
      {report && (
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center gap-[14px] p-[18px] rounded-[18px] bg-[#141016]">
            <div
              className="w-[48px] h-[48px] flex-none rounded-full flex items-center justify-center text-[22px] text-[#141016]"
              style={{ background: VERDICT_DISPLAY[report.worth_buying.verdict]?.bg ?? "#9A9298" }}
            >
              {VERDICT_DISPLAY[report.worth_buying.verdict]?.icon ?? "×"}
            </div>
            <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[28px] leading-none text-white">
              {report.worth_buying.label}
            </div>
          </div>
          <p className="m-0 font-[family-name:var(--font-grotesk)] text-[15px] leading-[1.7] text-[#3A343C]">
            {report.worth_buying.reasoning}
          </p>
        </div>
      )}
    </BottomSheet>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section
      className="min-h-full animate-fade"
      dir={dir}
      style={language === "ar" ? {
        ["--font-bodoni" as string]: "var(--font-arabic-serif)",
        ["--font-grotesk" as string]: "var(--font-arabic-sans)",
        ["--font-mono" as string]: "var(--font-arabic-sans)",
      } : undefined}
    >

      {/* ── MOBILE layout ── */}
      <div className="flex flex-col md:hidden">
        <div className="px-[20px] pt-[18px] flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
              {t.reportLabel}
            </span>
            <ConfidenceBadge report={report} loading={isLoading} lang={language} />
          </div>
          <LanguageToggle language={language} setLanguage={setLanguage} />
        </div>
        <div className="px-[20px] pt-[10px]">{imagePanel}</div>
        <div className="px-[20px] pt-[22px]">{verdictContent}</div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:grid md:grid-cols-[55%_1fr] md:min-h-full md:px-[40px] md:py-[40px] md:gap-[40px]">
        <div className="md:sticky md:top-[40px] md:self-start">
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center gap-[10px]">
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
                {t.reportLabel}
              </span>
              <ConfidenceBadge report={report} loading={isLoading} lang={language} />
            </div>
            <LanguageToggle language={language} setLanguage={setLanguage} />
          </div>
          {imagePanel}
        </div>
        <div>{verdictContent}</div>
      </div>

      {/* Bottom sheets */}
      {scoreSheet}
      {colorSheet}
      {paletteSheet}
      {buySheet}

    </section>
  );
}
