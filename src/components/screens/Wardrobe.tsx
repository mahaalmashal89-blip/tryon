"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadTryonHistory, deleteTryonSession, type SavedTryonSession, type StoredGarment } from "@/lib/tryonStore";
import { useLanguage } from "@/hooks/useLanguage";
import type { StyleReport } from "@/lib/types";

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    section:       "05 · My Wardrobe",
    heading:       "History",
    empty:         "No saved try-ons yet. Save a result from the try-on screen to see it here.",
    score:         "Score",
    saved:         "Saved",
    daysLeft:      "days left",
    deleteConfirm: "Delete this saved look?",
    cancel:        "Cancel",
    delete:        "Delete",
  },
  ar: {
    section:       "٠٥ · خزانة ملابسي",
    heading:       "السجل",
    empty:         "لم تحفظي أي نتيجة بعد. احفظي نتيجة من شاشة التجربة لتظهر هنا.",
    score:         "النقاط",
    saved:         "حُفظت",
    daysLeft:      "أيام متبقية",
    deleteConfirm: "حذف هذه الإطلالة المحفوظة؟",
    cancel:        "إلغاء",
    delete:        "حذف",
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

function garmentLabel(garments: StoredGarment[]): string {
  if (!garments?.length) return "—";
  return garments.map((g) => g.type).join(" + ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function WardrobeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [sessions, setSessions]           = useState<SavedTryonSession[]>([]);
  const [loading, setLoading]             = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const t   = T[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    loadTryonHistory()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await deleteTryonSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setConfirmDeleteId(null);
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
            const inConfirm = confirmDeleteId === session.id;

            return (
              <div
                key={session.id}
                className="relative flex gap-[14px] items-center p-[12px] border border-[rgba(20,16,22,0.1)] rounded-[16px] text-left w-full bg-white cursor-pointer hover:bg-[#FAF8F6] transition-colors"
                onClick={() => {
                  if (inConfirm) return;
                  router.push(`/wardrobe/${session.id}`);
                }}
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

                {/* Score + delete */}
                <div className="flex flex-col items-end gap-[8px] flex-none">
                  {score !== null && (
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[26px] leading-none text-[#141016]">
                        {score}
                      </div>
                      <div className="font-[family-name:var(--font-mono)] text-[9px] text-[#9A9298]">
                        /100
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center border border-[rgba(20,16,22,0.1)] bg-white text-[#9A9298] text-[16px] leading-none cursor-pointer hover:border-[rgba(20,16,22,0.25)] transition-colors"
                    aria-label={t.delete}
                  >
                    ×
                  </button>
                </div>

                {/* Delete confirm overlay */}
                {inConfirm && (
                  <div
                    className="absolute inset-0 rounded-[16px] bg-white flex flex-col items-center justify-center gap-[12px] px-[20px]"
                    style={{ border: "1px solid rgba(20,16,22,0.1)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="m-0 font-[family-name:var(--font-grotesk)] text-[13px] text-[#141016] text-center">
                      {t.deleteConfirm}
                    </p>
                    <div className="flex gap-[10px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        className="px-[18px] py-[8px] rounded-full border border-[rgba(20,16,22,0.14)] bg-white font-[family-name:var(--font-grotesk)] text-[13px] text-[#141016] cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                        className="px-[18px] py-[8px] rounded-full bg-[#141016] font-[family-name:var(--font-grotesk)] text-[13px] text-white cursor-pointer border-none"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
