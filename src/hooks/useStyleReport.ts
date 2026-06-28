"use client";

import { useEffect, useRef, useState } from "react";
import type { StyleReport } from "@/lib/types";
import { tryonSession } from "@/lib/tryonSession";

export type ReportState = "idle" | "loading" | "success" | "failed";

export function useStyleReport(resultUrl: string | null) {
  const [report, setReport] = useState<StyleReport | null>(null);
  const [reportState, setReportState] = useState<ReportState>("idle");
  const ran = useRef(false);

  useEffect(() => {
    if (!resultUrl || ran.current) return;
    ran.current = true;

    const garmentTypes = tryonSession.getGarments().map(g => g.type);
    if (garmentTypes.length === 0) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);

    setReportState("loading");

    fetch("/api/tryon/style-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result_image_url: resultUrl, garment_types: garmentTypes }),
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
  }, [resultUrl]);

  return { report, reportState };
}
