"use client";

import { useEffect, useRef, useState } from "react";
import type { DualReport } from "@/lib/types";
import { tryonSession } from "@/lib/tryonSession";

export type ReportState = "idle" | "loading" | "success" | "failed";

export function useStyleReport(resultUrl: string | null) {
  const [report, setReport] = useState<DualReport | null>(null);
  const [reportState, setReportState] = useState<ReportState>("idle");
  const ranKey = useRef<string | null>(null);

  useEffect(() => {
    if (!resultUrl) return;
    if (ranKey.current === resultUrl) return;
    ranKey.current = resultUrl;

    // Return cached dual report immediately — no API call needed
    const cached = tryonSession.getCachedReport();
    if (cached) {
      setReport(cached);
      setReportState("success");
      return;
    }

    const garmentTypes = tryonSession.getGarments().map(g => g.type);
    if (garmentTypes.length === 0) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);

    setReportState("loading");
    setReport(null);

    fetch("/api/tryon/style-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result_image_url: resultUrl, garment_types: garmentTypes }),
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok) throw new Error(`status=${res.status}`);
        return res.json() as Promise<DualReport>;
      })
      .then(data => {
        setReport(data);
        setReportState("success");
        tryonSession.saveReport(data);
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
  }, [resultUrl]);

  return { report, reportState };
}
