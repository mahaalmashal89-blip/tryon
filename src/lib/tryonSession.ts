/**
 * Module-level in-session state for the Upload → Outfit → Analyzing → Results flow.
 * Persists across Next.js client-side navigation. Lost on hard refresh (acceptable for this flow).
 *
 * Result URLs are stored in sessionStorage (cleared when the tab closes) with a
 * 30-minute TTL so they never linger indefinitely. No user photos or image data
 * are ever written to storage.
 */

import type { ClothingType, DualReport } from "@/lib/types";

export interface GarmentDraft {
  id: number;
  type: ClothingType;
  source: "url" | "image";
  url: string;         // product URL when source='url', else ""
  file: File | null;   // uploaded File when source='image', else null
  previewUrl: string;  // object URL for thumbnail display, or ""
}

interface Session {
  userPhotoFile: File | null;
  userPhotoPreviewUrl: string;
  garments: GarmentDraft[];
  resultImageUrl: string;
  error: string;
}

const RESULT_KEY = "tryon_last_result";
const RESULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface StoredResult {
  url: string;
  expiresAt: number;
  report?: DualReport;
}

const s: Session = {
  userPhotoFile: null,
  userPhotoPreviewUrl: "",
  garments: [],
  resultImageUrl: "",
  error: "",
};

export const tryonSession = {
  setUserPhoto(file: File) {
    if (s.userPhotoPreviewUrl) URL.revokeObjectURL(s.userPhotoPreviewUrl);
    s.userPhotoFile = file;
    s.userPhotoPreviewUrl = URL.createObjectURL(file);
  },
  getUserPhotoFile: ()       => s.userPhotoFile,
  getUserPhotoPreviewUrl: () => s.userPhotoPreviewUrl,

  setGarments(garments: GarmentDraft[]) { s.garments = [...garments]; },
  getGarments: () => s.garments,

  setResult(url: string) {
    s.resultImageUrl = url;
    try {
      const entry: StoredResult = { url, expiresAt: Date.now() + RESULT_TTL_MS };
      sessionStorage.setItem(RESULT_KEY, JSON.stringify(entry));
    } catch { /* quota or SSR */ }
  },
  getResult() {
    if (s.resultImageUrl) return s.resultImageUrl;
    try {
      const raw = sessionStorage.getItem(RESULT_KEY);
      if (!raw) return "";
      const entry: StoredResult = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        sessionStorage.removeItem(RESULT_KEY);
        return "";
      }
      return entry.url;
    } catch { return ""; }
  },

  saveReport(report: DualReport) {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY);
      if (!raw) return;
      const entry: StoredResult = JSON.parse(raw);
      entry.report = report;
      sessionStorage.setItem(RESULT_KEY, JSON.stringify(entry));
    } catch { /* quota or SSR */ }
  },
  getCachedReport(): DualReport | null {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY);
      if (!raw) return null;
      const entry: StoredResult = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) return null;
      return entry.report ?? null;
    } catch { return null; }
  },

  setError(err: string) { s.error = err; },
  getError: () => s.error,

  /**
   * Immediately release all image data from memory after the try-on completes
   * or fails. Revokes object URLs (frees browser memory), nullifies File
   * references (allows GC), and clears garment blob previews.
   * Call this on both the success path and the catch path in Analyzing.
   */
  clearImageData() {
    if (s.userPhotoPreviewUrl) {
      URL.revokeObjectURL(s.userPhotoPreviewUrl);
      s.userPhotoPreviewUrl = "";
    }
    s.userPhotoFile = null;

    for (const g of s.garments) {
      if (g.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(g.previewUrl);
        g.previewUrl = "";
      }
      g.file = null;
    }
  },
};
