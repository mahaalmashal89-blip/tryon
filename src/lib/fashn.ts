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
// This is the stable baseline order (commit dfd6c89), restored after the
// One Piece experiments. It is the physical "getting dressed" order:
//   full-body base → top → bottom → jacket (outermost, applied last)
//
// Why this order for Jacket + Skirt / Jacket + Pants (Case 4):
// This is the behavior that produced the best garment fidelity in real use.
// The bottom is applied first, then the jacket goes on as the outer layer.
// (An A/B test once suggested jacket-first prevents trouser restoration, but
// real-world testing across many runs showed bottom-first preserves the
// selected garments more faithfully, so we keep the baseline order.)
//
// Case 5 (Jacket + Dress / One Piece) keeps this same ordering but switches
// the jacket step to tryon-max — see buildTryonPlan(). That special case is
// EXPERIMENTAL and must never be applied to Skirt/Pants combinations.
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
 * Sort garments into the order that produces correct FASHN API results:
 *   Dress/One Piece → Top/Shirt → Jacket/Other → Pants/Skirt
 *
 * See LAYER_ORDER for the empirical reasoning behind this sequence.
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

// Full-body garments (connected top+bottom). When one of these is present with
// a jacket, v1.6 category="tops" would destroy the neckline/construction of
// the connected garment. tryon-max with a prompt is the only FASHN-native
// option for this case.
//
// NOTE: tryon-max was also tested for Jacket + separable bottoms (Skirt/Pants)
// but the trace confirmed it ignores preservation prompts — the skirt was lost
// even when tryon-max received the correct skirt result as its input. So
// tryon-max is reserved ONLY for connected full-body garments.
const CONNECTED_FULLBODY = new Set(["Dress", "One Piece"]);

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
  category?: FashnCategory;   // always present; sent to both models
  prompt?: string;            // present only for Case 5 jacket step (tryon-max + prompt)
}

/**
 * Build the ordered processing plan for an outfit.
 *
 * Three rules, applied in order:
 *
 * 1. Case 5 — connected full-body step when a jacket is also present:
 *    Dress / One Piece step → tryon-v1.6 (unchanged, preserves neckline
 *    before the jacket is layered on top).
 *
 * 2. Case 5 — jacket step over a connected full-body garment:
 *    → tryon-max + OUTER_LAYER_PROMPT (experimental, unchanged).
 *
 * 3. Everything else — single garments, Top+Bottom, Jacket+Skirt/Pants:
 *    → tryon-max with category, no prompt.
 *
 *    Git history shows the entire pipeline ran tryon-max during the period
 *    (commits 95cbec4→d873473) when garment fidelity was highest. The
 *    migration to tryon-v1.6 restored category-based targeting but may
 *    have reduced per-garment fidelity. This hybrid routes non-Case-5
 *    garments back to tryon-max while keeping Case 5 unchanged.
 */
export function buildTryonPlan<T extends { type: ClothingType | string }>(
  items: T[]
): TryonStep<T>[] {
  const sorted = sortByLayer(items);
  const hasConnectedFullBody = sorted.some((g) => CONNECTED_FULLBODY.has(g.type));
  const hasOuterwear         = sorted.some((g) => OUTERWEAR.has(g.type));

  return sorted.map((garment) => {
    const isOuterwear = OUTERWEAR.has(garment.type);

    // Case 5a: the Dress/One Piece step when a Jacket is also selected.
    // Keep v1.6 here — it correctly applies the one-piece before the jacket
    // is layered on top via tryon-max in the next step.
    if (!isOuterwear && hasConnectedFullBody && hasOuterwear) {
      return { garment, useMax: false, category: getFashnCategory(garment.type) };
    }

    // Case 5b: Jacket/Other over a connected full-body garment.
    // tryon-max + preservation prompt — experimental, unchanged.
    if (isOuterwear && hasConnectedFullBody) {
      return { garment, useMax: true, category: getFashnCategory(garment.type), prompt: OUTER_LAYER_PROMPT };
    }

    // All other cases (Cases 1–4): tryon-max with category, no prompt.
    // Matches the model used during the "good period" (95cbec4→d873473).
    return { garment, useMax: true, category: getFashnCategory(garment.type) };
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
