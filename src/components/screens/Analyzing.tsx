"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ANALYZE_STEPS } from "@/lib/types";
import { tryonSession } from "@/lib/tryonSession";
import { getFashnCategory, sortByLayer, fileToDataUrl, sleep } from "@/lib/fashn";
import { saveTryonSession } from "@/lib/tryonStore";

const MAX_POLL_ATTEMPTS = 90; // 3 minutes at 2-second intervals

export function AnalyzingScreen() {
  const router  = useRouter();
  const [step,  setStep]  = useState(0);
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    runTryon();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runTryon() {
    try {
      const userFile  = tryonSession.getUserPhotoFile();
      const garments  = tryonSession.getGarments();

      // Demo / preview mode: no real inputs yet
      if (!userFile || garments.length === 0) {
        for (let i = 0; i <= 3; i++) {
          setStep(i);
          await sleep(700);
        }
        router.push("/tryon/results");
        return;
      }

      // Step 0 — convert user photo to data URL
      setStep(0);
      const userPhotoDataUrl = await fileToDataUrl(userFile);

      // Sort garments: full-body items first, then layer top → bottom → jacket
      const sorted = sortByLayer(garments);
      let currentModel = userPhotoDataUrl;

      for (let gi = 0; gi < sorted.length; gi++) {
        const garment = sorted[gi];
        setStep(Math.min(gi + 1, 2));

        // Resolve garment image
        let garmentImage: string;
        if (garment.source === "image" && garment.file) {
          garmentImage = await fileToDataUrl(garment.file);
        } else if (garment.source === "url" && garment.url) {
          garmentImage = garment.url;
        } else {
          throw new Error(`Garment "${garment.type}" has no image or URL. Please add one.`);
        }

        // Submit to FASHN AI (via our server-side proxy)
        const runRes = await fetch("/api/tryon/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_image:   currentModel,
            garment_image: garmentImage,
            category:      getFashnCategory(garment.type),
          }),
        });

        const runData = await runRes.json();
        if (!runRes.ok) {
          throw new Error(runData.error ?? `FASHN API error (${runRes.status})`);
        }

        const predictionId: string = runData.id;
        if (!predictionId) throw new Error("FASHN API did not return a prediction ID.");

        // Poll for result
        let attempts = 0;
        let resultUrl = "";

        while (attempts < MAX_POLL_ATTEMPTS) {
          await sleep(2000);
          const statusRes  = await fetch(`/api/tryon/status/${predictionId}`);
          const statusData = await statusRes.json();

          if (statusData.status === "completed") {
            resultUrl = statusData.output?.[0] ?? "";
            if (!resultUrl) throw new Error("FASHN returned no output image.");
            break;
          }

          if (statusData.status === "failed") {
            const msg = typeof statusData.error === "object"
              ? (statusData.error?.message ?? statusData.error?.name ?? "Try-on generation failed.")
              : (statusData.error ?? "Try-on generation failed.");
            throw new Error(msg);
          }

          attempts++;
        }

        if (!resultUrl) throw new Error("Try-on timed out. Please try again.");
        currentModel = resultUrl;
      }

      // Step 3 — done; persist history to Supabase (no user photo — zero data retention)
      setStep(3);
      tryonSession.setResult(currentModel);
      await saveTryonSession(sorted, currentModel);

      // Release all image data from memory now that processing is complete.
      // This revokes blob URLs and nullifies File references so they can be GC'd.
      tryonSession.clearImageData();

      await sleep(500);
      router.push("/tryon/results");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      // Clear image data on failure too — never retain photos after processing ends.
      tryonSession.clearImageData();
      setError(msg);
      tryonSession.setError(msg);
    }
  }

  // Error state
  if (error) {
    return (
      <section className="min-h-full flex flex-col justify-center px-[30px] py-[40px] box-border animate-fade">
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-red-400">
          Something went wrong
        </span>
        <h1 className="mt-[10px] mb-[16px] font-[family-name:var(--font-bodoni)] font-medium text-[36px] leading-tight text-[#141016]">
          Try-on failed
        </h1>
        <p className="font-[family-name:var(--font-grotesk)] text-[14px] leading-[1.5] text-[#6B6470] mb-[28px]">
          {error}
        </p>
        <button
          onClick={() => router.push("/tryon/outfit")}
          className="w-full py-[17px] border-none rounded-full font-[family-name:var(--font-grotesk)] font-semibold text-[15px] text-[#141016] cursor-pointer"
          style={{ background: "var(--lav)" }}
        >
          ← Go back and try again
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-full flex flex-col justify-center px-[30px] py-[40px] box-border animate-fade">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[#141016]">
        AI Stylist · working
      </span>
      <h1 className="mt-[10px] mb-[26px] font-[family-name:var(--font-bodoni)] font-medium italic text-[40px] leading-none text-[#141016]">
        Dressing<br />you up…
      </h1>

      {/* Progress bar */}
      <div className="h-[6px] rounded-full bg-[#F2EEEC] overflow-hidden">
        <div
          className="h-full rounded-full shimmer-bar transition-all duration-700"
          style={{ width: `${Math.round((step / 3) * 100)}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-[26px] flex flex-col gap-[14px]">
        {ANALYZE_STEPS.map((label, i) => {
          const done   = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex items-center gap-[12px]">
              <span
                className="w-[20px] h-[20px] flex-none rounded-full flex items-center justify-center text-[11px] text-[#141016] transition-all duration-300"
                style={{
                  background: done   ? "var(--lime)" : active ? "#fff"             : "#F2EEEC",
                  border:     active ? "2px solid var(--lav)"                      : "none",
                  animation:  active ? "scPulse 1s ease infinite"                  : "none",
                }}
              >
                {done ? "✓" : ""}
              </span>
              <span
                className="font-[family-name:var(--font-grotesk)] text-[14px] transition-all duration-300"
                style={{
                  color:      done || active ? "#141016" : "#C3BBB6",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-[32px] font-[family-name:var(--font-grotesk)] text-[12px] text-[#B6ADA8] text-center leading-[1.5]">
        This usually takes 20–60 seconds per garment.
      </p>
    </section>
  );
}
