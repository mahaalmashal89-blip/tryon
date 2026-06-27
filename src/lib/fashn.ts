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

// Lower number = applied first when chaining garments
const LAYER_ORDER: Record<string, number> = {
  "Dress":       0,
  "One Piece":   0,
  "Top / Shirt": 1,
  "Pants":       2,
  "Skirt":       2,
  "Jacket":      3,
  "Other":       1,
};

export function getFashnCategory(type: string): FashnCategory {
  return CATEGORY_MAP[type] ?? "tops";
}

const OUTERWEAR = new Set(["Jacket", "Other"]);
const BASE_REPLACEABLE = new Set(["Top / Shirt", "Pants", "Skirt"]);

/**
 * Sort garments into layering order.
 *
 * Standard order: Dress/One Piece → Top/Shirt → Pants/Skirt → Jacket/Other
 *
 * Special case — Jacket/Outerwear + Dress/One Piece:
 * Apply the jacket FIRST on the clean user photo, then the one-piece on top.
 * Rationale: tryon-v1.6 with category="one-pieces" targets the full body and
 * can layer over an already-applied jacket silhouette better than a "tops" call
 * can overlay an already-applied connected garment.
 */
export function sortByLayer<T extends { type: ClothingType | string }>(items: T[]): T[] {
  const hasFullBody  = items.some((i) => i.type === "Dress" || i.type === "One Piece");
  const hasOuterwear = items.some((i) => OUTERWEAR.has(i.type));

  const filtered = hasFullBody
    ? items.filter((i) => !BASE_REPLACEABLE.has(i.type))  // drop Top/Shirt, Pants, Skirt
    : items;

  // Option 3: for Jacket + Dress/One Piece, reverse the order so the jacket
  // is applied to the clean user photo first, and the one-piece wraps over it.
  if (hasFullBody && hasOuterwear) {
    return [...filtered].sort((a, b) => {
      const orderA = OUTERWEAR.has(a.type) ? 0 : 1;
      const orderB = OUTERWEAR.has(b.type) ? 0 : 1;
      return orderA - orderB;
    });
  }

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
