/**
 * Module-level in-session state for the Upload → Outfit → Analyzing → Results flow.
 * Persists across Next.js client-side navigation. Lost on hard refresh (acceptable for this flow).
 * The final result URL is also written to localStorage for the Results screen to recover on refresh.
 */

import type { ClothingType } from "@/lib/types";

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
    try { localStorage.setItem(RESULT_KEY, url); } catch { /* quota */ }
  },
  getResult() {
    if (s.resultImageUrl) return s.resultImageUrl;
    try { return localStorage.getItem(RESULT_KEY) ?? ""; } catch { return ""; }
  },

  setError(err: string) { s.error = err; },
  getError: () => s.error,
};
