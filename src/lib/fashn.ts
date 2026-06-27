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
// This is the physical "getting dressed" order, inner layer → outer layer:
//   full-body base → top → bottom → jacket (outermost, applied last)
//
// The jacket is the OUTERMOST layer, so visually it must be applied last —
// its open hem needs to sit over the skirt waistband at the overlap zone.
//
// The catch: a tryon-v1.6 category="tops" call regenerates the waist region
// and reconstructs the ORIGINAL trousers, destroying any skirt underneath.
// We do NOT solve that by reordering (which would push the jacket under the
// skirt visually). Instead, when a bottom / full-body garment is present, the
// jacket step switches to tryon-max with a preservation prompt — see
// buildTryonPlan(). That keeps the jacket outermost AND keeps the bottom
// intact, because tryon-max is told not to regenerate the lower body.
const LAYER_ORDER: Record<string, number> = {
  "Dress":       0,  // full-body base — applied first
  "One Piece":   0,
  "Top / Shirt": 1,  // upper base layer
  "Pants":       2,  // bottoms over the base
  "Skirt":       2,
  "Jacket":      3,  // outerwear — applied LAST so it is the outermost layer
  "Other":       3,
};

export function getFashnCategory(type: string): FashnCategory {
  return CATEGORY_MAP[type] ?? "tops";
}

const OUTERWEAR = new Set(["Jacket", "Other"]);
const BASE_REPLACEABLE = new Set(["Top / Shirt", "Pants", "Skirt"]);

/**
 * Sort garments into the physical dressing order (inner → outer):
 *   Dress/One Piece → Top/Shirt → Pants/Skirt → Jacket/Other
 *
 * The jacket ends up last so it is the outermost visible layer.
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

// Garments that occupy the lower body. If any of these is in the outfit, the
// jacket must be applied via tryon-max (preservation) instead of tryon-v1.6
// (which would regenerate the waist and restore the original trousers).
const LOWER_OR_FULLBODY = new Set(["Pants", "Skirt", "Dress", "One Piece"]);

// Prompt for the jacket step on tryon-max. It tells the model to treat the
// jacket as an additive outer layer and to leave everything underneath — the
// lower garment especially — completely untouched.
export const OUTER_LAYER_PROMPT =
  "Add this jacket as an open outer layer worn over the existing outfit. " +
  "Keep everything underneath exactly as-is: do not change, replace, redesign, " +
  "or remove the lower garment, the skirt, the trousers, the top, or any " +
  "visible clothing. Only add the jacket as the outermost layer. " +
  "Do not restore or invent any garment that is not already visible.";

export interface TryonStep<T> {
  garment: T;
  useMax: boolean;            // true → tryon-max, false → tryon-v1.6
  category?: FashnCategory;   // present only when useMax === false
  prompt?: string;            // present only when useMax === true
}

/**
 * Build the ordered processing plan for an outfit.
 *
 * The user may select garments in any order; this normalizes them into the
 * physical dressing order and decides, per garment, which FASHN model applies
 * it:
 *
 *  - Base layers (Top/Shirt, Pants/Skirt, Dress/One Piece) → tryon-v1.6 with
 *    the matching category. These are faithful single-garment replacements.
 *
 *  - Jacket / Other (outerwear) applied LAST:
 *      • If the outfit ALSO contains a bottom or full-body garment, use
 *        tryon-max with OUTER_LAYER_PROMPT. tryon-v1.6's tops call would
 *        regenerate the waist and restore the original trousers, destroying
 *        the bottom; tryon-max is instructed to preserve it.
 *      • Otherwise (jacket alone, or jacket over just a top), use tryon-v1.6
 *        tops — there is no separate bottom to protect, so keeping the
 *        original lower body is correct.
 */
export function buildTryonPlan<T extends { type: ClothingType | string }>(
  items: T[]
): TryonStep<T>[] {
  const sorted = sortByLayer(items);
  const hasLowerOrFullBody = sorted.some((g) => LOWER_OR_FULLBODY.has(g.type));

  return sorted.map((garment) => {
    const isOuterwear = OUTERWEAR.has(garment.type);
    if (isOuterwear && hasLowerOrFullBody) {
      return { garment, useMax: true, prompt: OUTER_LAYER_PROMPT };
    }
    return { garment, useMax: false, category: getFashnCategory(garment.type) };
  });
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
