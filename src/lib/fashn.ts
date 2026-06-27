import type { ClothingType } from "@/lib/types";

export type FashnCategory = "tops" | "bottoms" | "one-pieces" | "auto";

const CATEGORY_MAP: Record<string, FashnCategory> = {
  "Jacket":      "tops",
  "Top / Shirt": "tops",
  "Pants":       "bottoms",
  "Skirt":       "bottoms",
  "Dress":       "one-pieces",
  "One Piece":   "one-pieces",
  "Other":       "tops",
};

// Lower number = applied FIRST when chaining sequential FASHN calls.
//
// CRITICAL ORDERING RULE — bottoms must be applied LAST.
//
// Each FASHN call regenerates the whole image and bleeds into adjacent
// regions. A category="tops" call (e.g. a jacket) does NOT stop at a clean
// waistline — it regenerates the waist zone too, and reconstructs whatever
// looks natural there. Given the user's original photo, that is the ORIGINAL
// trousers — so a tops call run AFTER a skirt call silently restores the
// trousers and destroys the skirt.
//
// Empirically verified (jacket + skirt):
//   skirt first, jacket last  → trousers restored, skirt lost   ❌
//   jacket first, skirt last  → jacket kept, skirt replaces all ✅
//
// Whichever garment is applied last "wins" its region. The original photo's
// trousers are the thing most likely to be wrongly restored, so the bottom
// garment must be the final call that touches the lower body.
//
//   Upper garments (Top/Shirt → Jacket/Other) FIRST,
//   then Bottoms (Pants/Skirt) LAST.
//
// Full-body base layers (Dress/One Piece) go first of all; when present they
// replace the base outfit and bottoms are dropped (see sortByLayer).
const LAYER_ORDER: Record<string, number> = {
  "Dress":       0,  // full-body base — applied first
  "One Piece":   0,
  "Top / Shirt": 1,  // upper base layer
  "Jacket":      2,  // outerwear, layered over the top
  "Other":       2,
  "Pants":       3,  // bottoms applied LAST so they definitively replace
  "Skirt":       3,  // the original trousers without being overwritten
};

export function getFashnCategory(type: string): FashnCategory {
  return CATEGORY_MAP[type] ?? "tops";
}

const OUTERWEAR = new Set(["Jacket", "Other"]);
const BASE_REPLACEABLE = new Set(["Top / Shirt", "Pants", "Skirt"]);

/**
 * Sort garments into the order they must be applied to FASHN.
 *
 * Application order: Dress/One Piece → Top/Shirt → Jacket/Other → Pants/Skirt
 *
 * Bottoms are deliberately applied LAST — see LAYER_ORDER for the full
 * rationale. A tops/jacket call regenerates the waist zone and restores the
 * original trousers, so any bottom applied before it gets overwritten.
 *
 * If a Dress or One Piece is present it replaces the base outfit layer
 * (Top/Shirt, Pants, Skirt are discarded), but outerwear (Jacket, Other)
 * is still applied on top.
 */
export function sortByLayer<T extends { type: ClothingType | string }>(items: T[]): T[] {
  const hasFullBody = items.some((i) => i.type === "Dress" || i.type === "One Piece");

  const filtered = hasFullBody
    ? items.filter((i) => !BASE_REPLACEABLE.has(i.type))  // drop Top/Shirt, Pants, Skirt
    : items;

  return [...filtered].sort(
    (a, b) => (LAYER_ORDER[a.type] ?? 1) - (LAYER_ORDER[b.type] ?? 1)
  );
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
