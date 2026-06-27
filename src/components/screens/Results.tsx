"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResultsVariant, STYLING_TIPS } from "@/lib/types";
import { MiniTab } from "@/components/ui/TabBar";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { tryonSession } from "@/lib/tryonSession";
import { saveTryonSession } from "@/lib/tryonStore";
import { compositeStudio } from "@/lib/studioComposite";

const SCORE = 87;

export function ResultsScreen() {
  const router = useRouter();
  const [variant, setVariant]         = useState<ResultsVariant>("a");
  const [mounted, setMounted]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [compositedUrl, setCompositedUrl] = useState<string | null>(null);
  const compositeBlobRef = useRef<string | null>(null);

  const resultUrl = mounted ? tryonSession.getResult() : null;

  useEffect(() => { setMounted(true); }, []);

  // Composite onto studio background once resultUrl is known
  useEffect(() => {
    if (!resultUrl) return;
    let active = true;

    compositeStudio(resultUrl)
      .then((blobUrl) => {
        if (!active) { URL.revokeObjectURL(blobUrl); return; }
        // Revoke any previous composite
        if (compositeBlobRef.current) URL.revokeObjectURL(compositeBlobRef.current);
        compositeBlobRef.current = blobUrl;
        setCompositedUrl(blobUrl);
      })
      .catch(() => { /* Fall back to plain resultUrl on canvas failure */ });

    return () => {
      active = false;
      if (compositeBlobRef.current) {
        URL.revokeObjectURL(compositeBlobRef.current);
        compositeBlobRef.current = null;
      }
    };
  }, [resultUrl]);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      if (compositedUrl) {
        // Composited JPEG is already a local blob — download directly
        const a = document.createElement("a");
        a.href = compositedUrl;
        a.download = "tryon-result.jpg";
        a.click();
      } else if (resultUrl) {
        // Fallback: proxy download of the raw FASHN result
        const res = await fetch(`/api/tryon/download?url=${encodeURIComponent(resultUrl)}`);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "tryon-result.jpg";
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
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

  // Display URL: composited studio image once ready, raw result while compositing
  const displayUrl = compositedUrl ?? resultUrl;

  const imagePanel = (
    <div className="relative rounded-[20px] overflow-hidden border border-[rgba(20,16,22,0.08)] bg-[#f0ede8] h-[380px] md:h-full md:min-h-[560px]">
      {displayUrl ? (
        <img
          key={displayUrl}
          src={displayUrl}
          alt="AI-generated try-on result"
          className="absolute inset-0 w-full h-full object-contain object-center animate-fade"
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
      <ScoreCircle score={SCORE} />
    </div>
  );

  const verdictContent = (
    <>
      {/* Variant A */}
      {variant === "a" && (
        <div>
          <h1 className="m-0 mb-[16px] font-[family-name:var(--font-bodoni)] font-medium text-[30px] leading-none text-[#141016]">
            The verdict
          </h1>
          <div className="flex flex-col">
            <div className="flex justify-between items-baseline py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Color match</span>
              <span className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">Strong · warm undertone</span>
            </div>
            <div className="flex justify-between items-baseline py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Size advice</span>
              <span className="font-[family-name:var(--font-bodoni)] text-[22px] text-[#141016]">True to size · M</span>
            </div>
            <div className="py-[15px]" style={{ borderTop: "1px solid rgba(20,16,22,0.1)" }}>
              <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Styling tips</span>
              <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
                {STYLING_TIPS.map((text, i) => (
                  <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#141016] pt-[2px]">0{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Variant B */}
      {variant === "b" && (
        <div>
          <div className="flex items-end gap-[14px] pb-[18px]" style={{ borderBottom: "1px solid rgba(20,16,22,0.1)" }}>
            <span className="font-[family-name:var(--font-bodoni)] font-semibold text-[84px] leading-[0.8] tracking-[-0.02em] text-[#141016]">
              {SCORE}
            </span>
            <div className="pb-[8px]">
              <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Out of 100</div>
              <div
                className="inline-block mt-[5px] px-[10px] py-[3px] rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[13px] text-[#141016]"
                style={{ background: "var(--lime)" }}
              >
                A standout on you
              </div>
            </div>
          </div>
          <div className="flex gap-[12px] mt-[18px]">
            {[["Color", "Strong"], ["Size", "True · M"]].map(([label, val]) => (
              <div key={label} className="flex-1 border border-[rgba(20,16,22,0.1)] rounded-[14px] p-[14px]">
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#9A9298]">{label}</div>
                <div className="font-[family-name:var(--font-bodoni)] text-[19px] text-[#141016] mt-[4px]">{val}</div>
              </div>
            ))}
          </div>
          <div className="mt-[18px]">
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[#9A9298]">Styling notes</span>
            <ul className="m-0 mt-[12px] p-0 list-none flex flex-col gap-[10px]">
              {STYLING_TIPS.map((text, i) => (
                <li key={i} className="flex gap-[10px] font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.45] text-[#3A343C]">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#141016] pt-[2px]">0{i + 1}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Buy banner */}
      <div className="mt-[22px]">
        <div className="flex items-center gap-[14px] p-[18px] rounded-[18px] bg-[#141016]">
          <div
            className="w-[48px] h-[48px] flex-none rounded-full flex items-center justify-center text-[22px] text-[#141016]"
            style={{ background: "var(--lime)" }}
          >
            ✓
          </div>
          <div>
            <div className="font-[family-name:var(--font-bodoni)] font-semibold text-[24px] leading-none text-white">
              Worth buying
            </div>
            <div className="font-[family-name:var(--font-grotesk)] text-[13px] text-[rgba(255,255,255,0.7)] mt-[3px]">
              Flatters your shape, colour and palette.
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-[16px] pb-[calc(22px+env(safe-area-inset-bottom))] md:pb-[22px] flex flex-col gap-[10px]">
        {/* Primary: Download + Save for later */}
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

        {/* Secondary: Try another + A/B switcher */}
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

        {/* Privacy note */}
        <p className="m-0 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] uppercase text-[#B6ADA8]">
          Your photo is never stored · Zero Data Retention
        </p>
      </div>
    </>
  );

  return (
    <section className="min-h-full animate-fade">

      {/* ── MOBILE layout (single column) ── */}
      <div className="flex flex-col md:hidden">
        <div className="px-[20px] pt-[18px]">
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
            AI Stylist Report
          </span>
        </div>
        <div className="px-[20px] pt-[10px]">{imagePanel}</div>
        <div className="px-[20px] pt-[22px]">{verdictContent}</div>
      </div>

      {/* ── DESKTOP layout (two columns) ── */}
      <div className="hidden md:grid md:grid-cols-[55%_1fr] md:min-h-full md:px-[40px] md:py-[40px] md:gap-[40px]">
        {/* Left: image */}
        <div className="md:sticky md:top-[40px] md:self-start">
          <span className="block mb-[16px] font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#9A9298]">
            AI Stylist Report
          </span>
          {imagePanel}
        </div>

        {/* Right: verdict + actions */}
        <div>{verdictContent}</div>
      </div>

    </section>
  );
}
