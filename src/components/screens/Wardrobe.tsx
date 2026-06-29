"use client";

import { useState, useEffect } from "react";
import { loadTryonHistory, type SavedTryonSession, type StoredGarment } from "@/lib/tryonStore";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import type { StyleReport } from "@/lib/types";

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    section:   "05 · My Wardrobe",
    heading:   "History",
    empty:     "No saved try-ons yet. Save a result from the try-on screen to see it here.",
    score:     "Score",
    garments:  "Garments",
    style:     "Style",
    colorType: "Color Type",
    verdict:   "Shopping Verdict",
    tips:      "Styling Tips",
    saved:     "Saved",
    daysLeft:  "days left",
    noReport:  "AI report not available for this saved session.",
  },
  ar: {
    section:   "٠٥ · خزانة ملابسي",
    heading:   "السجل",
    empty:     "لم تحفظي أي نتيجة بعد. احفظي نتيجة من شاشة التجربة لتظهر هنا.",
    score:     "النقاط",
    garments:  "القطع",
    style:     "الأسلوب",
    colorType: "نوع اللون",
    verdict:   "قرار الشراء",
    tips:      "نصائح التنسيق",
    saved:     "حُفظت",
    daysLeft:  "أيام متبقية",
    noReport:  "التقرير غير متاح لهذه الجلسة المحفوظة.",
  },
};

const VERDICT_STYLES: Record<string, { bg: string; fg: string }> = {
  BUY:   { bg: "var(--lime)",                                      fg: "#141016" },
  MAYBE: { bg: "color-mix(in srgb, var(--lav) 45%, #fff)",         fg: "#141016" },
  SKIP:  { bg: "#F2EEEC",                                          fg: "#9A9298" },
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

        {/* Score + verdict */}
        {report && (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[2px]">
                {t.score}
              </div>
              <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[48px] leading-none text-[#141016]">
                {report.score}
                <span className="text-[18px] text-[#9A9298]">/100</span>
              </div>
            </div>
            {vs && verdict && (
              <span
                className="px-[16px] py-[8px] rounded-full font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em]"
                style={{ background: vs.bg, color: vs.fg }}
              >
                {verdict}
              </span>
            )}
          </div>
        )}

        {/* Language toggle — only when both EN and AR are saved */}
        {session.style_report?.en && session.style_report?.ar && (
          <div className="flex items-center gap-[2px] self-start rounded-full border border-[rgba(20,16,22,0.12)] overflow-hidden">
            {(["en", "ar"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-[10px] py-[5px] border-none cursor-pointer font-[family-name:var(--font-mono)] text-[10px] tracking-[0.06em] transition-colors"
                style={{
                  background: lang === l ? "#141016" : "transparent",
                  color:      lang === l ? "#fff"     : "#9A9298",
                }}
              >
                {l === "en" ? "EN" : "عربية"}
              </button>
            ))}
          </div>
        )}

        {report ? (
          <div className="flex flex-col">

            {/* Garments */}
            <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[6px]">
                {t.garments}
              </div>
              <div className="font-[family-name:var(--font-grotesk)] text-[14px] text-[#141016]">
                {garmentLabel(session.garments)}
              </div>
            </div>

            {/* Style category */}
            {report.style_category && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[6px]">
                  {t.style}
                </div>
                <div className="font-[family-name:var(--font-bodoni)] text-[20px] text-[#141016]">
                  {report.style_category}
                </div>
              </div>
            )}

            {/* Personal color type */}
            {report.personal_color_analysis?.color_type && (
              <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[6px]">
                  {t.colorType}
                </div>
                <div className="font-[family-name:var(--font-bodoni)] text-[20px] text-[#141016]">
                  {report.personal_color_analysis.color_type}
                </div>
              </div>
            )}

            {/* Shopping verdict */}
            <div className="py-[14px]" style={{ borderTop: "1px solid rgba(20,16,22,0.08)" }}>
              <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.14em] uppercase text-[#9A9298] mb-[8px]">
                {t.verdict}
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
                  {t.tips}
                </div>
                <ul className="m-0 p-0 list-none flex flex-col gap-[10px]">
                  {report.styling_tips.slice(0, 3).map((tip, i) => (
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
  const [sessions, setSessions] = useState<SavedTryonSession[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<SavedTryonSession | null>(null);

  const t   = T[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    loadTryonHistory()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

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

            return (
              <button
                key={session.id}
                onClick={() => setSelected(session)}
                className="flex gap-[14px] items-center p-[12px] border border-[rgba(20,16,22,0.1)] rounded-[16px] text-left w-full bg-white cursor-pointer hover:bg-[#FAF8F6] transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-[64px] h-[80px] flex-none rounded-[11px] overflow-hidden border border-[rgba(20,16,22,0.06)] bg-[#F2EEEC]">
                  {session.result_image_url ? (
                    <img
                      src={session.result_image_url}
                      alt="Try-on result"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="hatch absolute inset-0" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
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
                </div>

                {/* Score */}
                {score !== null && (
                  <div className="text-right flex-none">
                    <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[26px] leading-none text-[#141016]">
                      {score}
                    </div>
                    <div className="font-[family-name:var(--font-mono)] text-[9px] text-[#9A9298]">
                      /100
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail sheet — opens on card tap */}
      <SessionDetailSheet
        session={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        language={language}
      />
    </section>
  );
}
