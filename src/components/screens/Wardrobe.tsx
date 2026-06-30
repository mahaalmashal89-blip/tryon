"use client";

import { useState, useEffect } from "react";
import { loadTryonHistory, deleteTryonSession, type SavedTryonSession, type StoredGarment } from "@/lib/tryonStore";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import type { StyleReport } from "@/lib/types";

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    section:        "05 · My Wardrobe",
    heading:        "History",
    empty:          "No saved try-ons yet. Save a result from the try-on screen to see it here.",
    score:          "Score",
    scoreBreakdown: "Score Breakdown",
    garments:       "Garments",
    style:          "Style",
    colorMatch:     "Color Match",
    colorType:      "Personal Color Type",
    colorWhy:       "Why",
    outfitAdvice:   "Outfit Color Advice",
    colorPicks:     "Color Picks for Next Time",
    verdict:        "Shopping Verdict",
    tips:           "Styling Tips",
    saved:          "Saved",
    daysLeft:       "days left",
    noReport:       "AI report not available for this saved session.",
    delete:         "Delete",
    deleteConfirm:  "Confirm delete",
    deleteCancel:   "Cancel",
    confidence: {
      high:   "High confidence",
      medium: "Medium confidence",
      low:    "Low confidence",
    },
    scoreLabels: {
      color_harmony:     "Color Harmony",
      outfit_cohesion:   "Outfit Cohesion",
      layering:          "Layering & Structure",
      visual_balance:    "Visual Balance",
      style_suitability: "Style Suitability",
    },
  },
  ar: {
    section:        "٠٥ · خزانة ملابسي",
    heading:        "السجل",
    empty:          "لم تحفظي أي نتيجة بعد. احفظي نتيجة من شاشة التجربة لتظهر هنا.",
    score:          "النقاط",
    scoreBreakdown: "تفصيل النقاط",
    garments:       "القطع",
    style:          "الأسلوب",
    colorMatch:     "تناسق الألوان",
    colorType:      "نوع لونك الشخصي",
    colorWhy:       "السبب",
    outfitAdvice:   "نصيحة لإطلالتك",
    colorPicks:     "الألوان المقترحة للمرة القادمة",
    verdict:        "قرار الشراء",
    tips:           "نصائح التنسيق",
    saved:          "حُفظت",
    daysLeft:       "أيام متبقية",
    noReport:       "التقرير غير متاح لهذه الجلسة المحفوظة.",
    delete:         "حذف",
    deleteConfirm:  "تأكيد الحذف",
    deleteCancel:   "إلغاء",
    confidence: {
      high:   "ثقة عالية",
      medium: "ثقة متوسطة",
      low:    "ثقة منخفضة",
    },
    scoreLabels: {
      color_harmony:     "تناسق الألوان",
      outfit_cohesion:   "تناسق القطع",
      layering:          "التطبيق والبنية",
      visual_balance:    "التوازن البصري",
      style_suitability: "ملاءمة الأسلوب",
    },
  },
};

const VERDICT_STYLES: Record<string, { bg: string; fg: string }> = {
  BUY:   { bg: "var(--lime)",                                fg: "#141016" },
  MAYBE: { bg: "color-mix(in srgb, var(--lav) 45%, #fff)", fg: "#141016" },
  SKIP:  { bg: "#F2EEEC",                                   fg: "#9A9298" },
};

const CONFIDENCE_COLORS: Record<StyleReport["confidence"], string> = {
  high:   "#6B9E6B",
  medium: "#B08A3E",
  low:    "#9A7070",
};

const VERDICT_MAP: Record<string, "BUY" | "MAYBE" | "SKIP"> = {
  worth_it: "BUY",
  maybe:    "MAYBE",
  skip:     "SKIP",
};

function verdictFromReport(report: StyleReport): "BUY" | "MAYBE" | "SKIP" {
  return VERDICT_MAP[report.worth_buying.verdict] ?? "MAYBE";
}

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

function garmentLabel(garments: StoredGarment[]): string {
  if (!garments?.length) return "—";
  return garments.map((g) => g.type).join(" + ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, note, max = 20 }: { label: string; score: number; note?: string; max?: number }) {
  const pct   = Math.min(100, (score / max) * 100);
  const color = pct >= 75 ? "var(--lime)" : pct >= 50 ? "#F4C87A" : "#E8928A";
  return (
    <div className="py-[12px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
      <div className="flex items-center gap-[12px] mb-[8px]">
        <span className="flex-1 font-[family-name:var(--font-grotesk)] text-[13px] text-[#6B6470]">{label}</span>
        <span className="font-[family-name:var(--font-bodoni)] text-[17px] text-[#141016]">
          {score}<span className="text-[11px] text-[#9A9298]">/{max}</span>
        </span>
      </div>
      <div className="h-[5px] w-full rounded-full bg-[#F2EEEC] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      {note && (
        <p className="m-0 mt-[5px] font-[family-name:var(--font-grotesk)] text-[11px] leading-[1.5] text-[#9A9298]">{note}</p>
      )}
    </div>
  );
}

// ── Detail bottom sheet ───────────────────────────────────────────────────────

function SessionDetailSheet({
  session,
  open,
  onClose,
  language,
}: {
  session: SavedTryonSession | null;
  open: boolean;
  onClose: () => void;
  language: Language;
}) {
  const [lang, setLang] = useState<Language>(language);

  useEffect(() => { if (open) setLang(language); }, [open, language]);

  if (!session) return null;

  const report  = session.style_report?.[lang] ?? null;
  const verdict = report ? verdictFromReport(report) : null;
  const vs      = verdict ? VERDICT_STYLES[verdict] : null;
  const t       = T[language];
  const tl      = T[lang];
  const dir     = lang === "ar" ? "rtl" : "ltr";

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={garmentLabel(session.garments)}
      dir={dir}
    >
      <div className="flex flex-col gap-[20px]" dir={dir}>

        {/* Result image */}
        {session.result_image_url && (
          <div
            className="relative rounded-[16px] overflow-hidden bg-[#F8F5F2] w-full"
            style={{ aspectRatio: "3 / 4" }}
          >
            <img
              src={session.result_image_url}
              alt="Try-on result"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Language toggle */}
        {session.style_report?.en && session.style_report?.ar && (
          <div className="flex items-center gap-[2px] self-start rounded-full border border-[rgba(20,16,22,0.12)] overflow-hidden">
            {(["en", "ar"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-[10px] py-[5px] border-none cursor-pointer font-[family-name:var(--font-mono)] text-[10px] tracking-[0.06em] transition-colors"
                style={{
                  background: lang === l ? "#141016" : "transparent",
                  color:      lang === l ? "#fff"    : "#9A9298",
                }}
              >
                {l === "en" ? "EN" : "عربية"}
              </button>
            ))}
          </div>
        )}

        {report ? (
          <div className="flex flex-col">

            {/* Score + confidence */}
            <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[4px]">
                {tl.score}
              </div>
              <div className="flex items-baseline gap-[10px]">
                <span className="font-[family-name:var(--font-bodoni)] font-semibold text-[52px] leading-none text-[#141016]">
                  {report.score}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[13px] text-[#9A9298]">/100</span>
                <span
                  className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.1em] uppercase"
                  style={{ color: CONFIDENCE_COLORS[report.confidence] }}
                >
                  · {tl.confidence[report.confidence]}
                </span>
              </div>
              {report.score_reasoning && (
                <p className="m-0 mt-[8px] font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.55] text-[#6B6470]">
                  {report.score_reasoning}
                </p>
              )}
            </div>

            {/* Score breakdown */}
            {report.score_breakdown && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[4px]">
                  {tl.scoreBreakdown}
                </div>
                {(Object.keys(tl.scoreLabels) as Array<keyof typeof tl.scoreLabels>).map((key) => (
                  <ScoreBar
                    key={key}
                    label={tl.scoreLabels[key]}
                    score={report.score_breakdown[key]}
                    note={report.score_notes?.[key]}
                  />
                ))}
              </div>
            )}

            {/* Color Match */}
            {report.color_match && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[6px]">
                  {tl.colorMatch}
                </div>
                <div className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016] mb-[6px]">
                  {report.color_match.rating} · {report.color_match.palette_type}
                </div>
                <p className="m-0 font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.6] text-[#3A343C]">
                  {report.color_match.detail}
                </p>
                {report.outfit_cohesion?.detail && (
                  <p className="m-0 mt-[8px] font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.6] text-[#6B6470]">
                    {report.outfit_cohesion.detail}
                  </p>
                )}
              </div>
            )}

            {/* Personal Color Analysis */}
            {report.personal_color_analysis && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[6px]">
                  {tl.colorType}
                </div>
                <div className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016] mb-[8px]">
                  {report.personal_color_analysis.color_type}
                </div>
                {report.personal_color_analysis.reason && (
                  <>
                    <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em] uppercase text-[#9A9298] mb-[4px]">
                      {tl.colorWhy}
                    </div>
                    <p className="m-0 mb-[10px] font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.6] text-[#3A343C]">
                      {report.personal_color_analysis.reason}
                    </p>
                  </>
                )}
                {report.personal_color_analysis.outfit_advice && (
                  <>
                    <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em] uppercase text-[#9A9298] mb-[4px]">
                      {tl.outfitAdvice}
                    </div>
                    <p className="m-0 font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.6] text-[#3A343C]">
                      {report.personal_color_analysis.outfit_advice}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Style category */}
            {report.style_category && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[6px]">
                  {tl.style}
                </div>
                <div className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">
                  {report.style_category}
                </div>
              </div>
            )}

            {/* Shopping verdict */}
            <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[8px]">
                {tl.verdict}
              </div>
              {vs && (
                <div
                  className="inline-block px-[12px] py-[5px] rounded-full font-[family-name:var(--font-grotesk)] text-[13px] font-medium mb-[10px]"
                  style={{ background: vs.bg, color: vs.fg }}
                >
                  {report.worth_buying.label}
                </div>
              )}
              <p className="m-0 font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.65] text-[#3A343C]">
                {report.worth_buying.reasoning}
              </p>
            </div>

            {/* Styling tips */}
            {report.styling_tips?.length > 0 && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[10px]">
                  {tl.tips}
                </div>
                <ul className="m-0 p-0 list-none flex flex-col gap-[10px]">
                  {report.styling_tips.map((tip, i) => (
                    <li key={i} className="flex gap-[12px] items-start">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#C4BEC8] pt-[2px] flex-none">
                        0{i + 1}
                      </span>
                      <span className="font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.65] text-[#3A343C]">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Color recommendations */}
            {report.color_recommendations?.length > 0 && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[10px]">
                  {tl.colorPicks}
                </div>
                <ul className="m-0 p-0 list-none flex flex-col gap-[10px]">
                  {report.color_recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-[10px] items-start">
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#C4BEC8] pt-[2px] flex-none">→</span>
                      <span className="font-[family-name:var(--font-grotesk)] text-[13px] leading-[1.65] text-[#3A343C]">
                        {rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Date + expiry */}
            <div className="pt-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] text-[#9A9298]">
                {t.saved} {formatDate(session.created_at)} · {daysLeft(session.expires_at)} {t.daysLeft}
              </span>
            </div>

          </div>
        ) : (
          /* Graceful fallback: session saved before report persistence existed */
          <>
            <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[6px]">
                {t.garments}
              </div>
              <div className="font-[family-name:var(--font-grotesk)] text-[14px] text-[#141016]">
                {garmentLabel(session.garments)}
              </div>
            </div>
            <p className="m-0 font-[family-name:var(--font-grotesk)] text-[14px] text-[#9A9298]">
              {t.noReport}
            </p>
            <div className="pt-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.12em] text-[#9A9298]">
                {t.saved} {formatDate(session.created_at)} · {daysLeft(session.expires_at)} {t.daysLeft}
              </span>
            </div>
          </>
        )}

      </div>
    </BottomSheet>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function WardrobeScreen() {
  const { language } = useLanguage();
  const [sessions,        setSessions]        = useState<SavedTryonSession[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [selected,        setSelected]        = useState<SavedTryonSession | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);

  const t   = T[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    loadTryonHistory()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteConfirmed(id: string) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deleteTryonSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) setSelected(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      className="min-h-full px-[20px] pt-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] box-border animate-fade"
      dir={dir}
    >
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
        {t.section}
      </span>
      <h1 className="mt-[8px] mb-[18px] font-[family-name:var(--font-bodoni)] font-medium text-[38px] leading-[0.98] text-[#141016]">
        {t.heading}
      </h1>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-[12px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex gap-[14px] items-center p-[12px] border border-[rgba(20,16,22,0.1)] rounded-[16px]"
            >
              <div className="w-[64px] h-[80px] flex-none rounded-[11px] bg-[#F2EEEC] animate-pulse" />
              <div className="flex-1 flex flex-col gap-[8px]">
                <div className="h-[10px] w-[60px] rounded bg-[#F2EEEC] animate-pulse" />
                <div className="h-[20px] w-[140px] rounded bg-[#F2EEEC] animate-pulse" />
                <div className="h-[22px] w-[50px] rounded-full bg-[#F2EEEC] animate-pulse" />
              </div>
              <div className="flex flex-col items-end gap-[6px]">
                <div className="h-[26px] w-[32px] rounded bg-[#F2EEEC] animate-pulse" />
                <div className="h-[10px] w-[28px] rounded bg-[#F2EEEC] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <p className="font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.65] text-[#9A9298] mt-[8px]">
          {t.empty}
        </p>
      )}

      {/* Session list */}
      {!loading && sessions.length > 0 && (
        <div className="flex flex-col gap-[12px]">
          {sessions.map((session) => {
            const report  = session.style_report?.[language] ?? null;
            const score   = report?.score ?? null;
            const verdict = report ? verdictFromReport(report) : null;
            const vs      = verdict ? VERDICT_STYLES[verdict] : null;
            const isConfirming = confirmDeleteId === session.id;
            const isDeleting   = deletingId === session.id;

            return (
              <div
                key={session.id}
                className="flex gap-[14px] items-center p-[12px] border border-[rgba(20,16,22,0.1)] rounded-[16px] bg-white hover:bg-[#FAF8F6] transition-colors"
                style={{ opacity: isDeleting ? 0.4 : 1 }}
              >
                {/* Thumbnail — always taps to open detail */}
                <button
                  onClick={() => { setConfirmDeleteId(null); setSelected(session); }}
                  className="relative w-[64px] h-[80px] flex-none rounded-[11px] overflow-hidden border border-[rgba(20,16,22,0.06)] bg-[#F2EEEC] p-0 border-none cursor-pointer"
                  aria-label="Open details"
                >
                  {session.result_image_url ? (
                    <img
                      src={session.result_image_url}
                      alt="Try-on result"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="hatch absolute inset-0" />
                  )}
                </button>

                {/* Info area — taps to open detail */}
                <button
                  onClick={() => { setConfirmDeleteId(null); setSelected(session); }}
                  className="flex-1 min-w-0 text-left border-none bg-transparent p-0 cursor-pointer"
                >
                  <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298]">
                    {formatDate(session.created_at)}
                  </div>
                  <div className="font-[family-name:var(--font-bodoni)] text-[18px] text-[#141016] mt-[2px] truncate">
                    {garmentLabel(session.garments)}
                  </div>
                  {vs && verdict && (
                    <span
                      className="inline-block mt-[7px] px-[10px] py-[3px] rounded-full font-[family-name:var(--font-mono)] text-[9px] tracking-[0.12em]"
                      style={{ background: vs.bg, color: vs.fg }}
                    >
                      {verdict}
                    </span>
                  )}
                </button>

                {/* Score */}
                {score !== null && !isConfirming && (
                  <button
                    onClick={() => { setConfirmDeleteId(null); setSelected(session); }}
                    className="text-right flex-none border-none bg-transparent p-0 cursor-pointer"
                  >
                    <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[26px] leading-none text-[#141016]">
                      {score}
                    </div>
                    <div className="font-[family-name:var(--font-mono)] text-[9px] text-[#9A9298]">/100</div>
                  </button>
                )}

                {/* Delete / confirm */}
                {isConfirming ? (
                  <div className="flex flex-col gap-[5px] flex-none">
                    <button
                      onClick={() => handleDeleteConfirmed(session.id)}
                      disabled={isDeleting}
                      className="px-[10px] py-[5px] rounded-full border-none bg-[#141016] font-[family-name:var(--font-mono)] text-[9px] tracking-[0.08em] text-white cursor-pointer whitespace-nowrap"
                    >
                      {t.deleteConfirm}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-[10px] py-[5px] rounded-full border border-[rgba(20,16,22,0.14)] bg-white font-[family-name:var(--font-mono)] text-[9px] tracking-[0.08em] text-[#6B6470] cursor-pointer"
                    >
                      {t.deleteCancel}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                    disabled={isDeleting}
                    className="w-[28px] h-[28px] flex-none flex items-center justify-center rounded-full bg-[#F2EEEC] border-none cursor-pointer font-[family-name:var(--font-grotesk)] text-[12px] text-[#9A9298] hover:bg-[#EAE5E3] transition-colors"
                    aria-label={t.delete}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail sheet */}
      <SessionDetailSheet
        session={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        language={language}
      />
    </section>
  );
}
