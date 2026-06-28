"use client";

import { useEffect, useRef, useState } from "react";
import type { StyleReport } from "@/lib/types";
import type { Language } from "@/hooks/useLanguage";
import { tryonSession } from "@/lib/tryonSession";

export type ReportState = "idle" | "loading" | "success" | "failed";

export function useStyleReport(resultUrl: string | null, language: Language = "en") {
  const [report, setReport] = useState<StyleReport | null>(null);
  const [reportState, setReportState] = useState<ReportState>("idle");
  // Key tracks both URL and language so switching language triggers a re-fetch
  const ranKey = useRef<string | null>(null);

  useEffect(() => {
    if (!resultUrl) return;
    const key = `${resultUrl}:${language}`;
    if (ranKey.current === key) return;
    ranKey.current = key;

    const garmentTypes = tryonSession.getGarments().map(g => g.type);
    if (garmentTypes.length === 0) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);

    setReportState("loading");
    setReport(null);

    fetch("/api/tryon/style-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result_image_url: resultUrl, garment_types: garmentTypes, language }),
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok) throw new Error(`status=${res.status}`);
        return res.json() as Promise<StyleReport>;
      })
      .then(data => {
        setReport(data);
        setReportState("success");
      })
      .catch(() => {
        setReportState("failed");
      })
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [resultUrl, language]);

  return { report, reportState };
}
