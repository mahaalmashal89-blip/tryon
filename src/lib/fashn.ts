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
// ORDER IS DETERMINED BY API BEHAVIOR, NOT VISUAL LAYERING:
//
// tryon-v1.6 category="tops" (jacket) regenerates the waist region and
// reconstructs the original trousers from the user photo — destroying any
// skirt applied in a prior step.
//
// tryon-v1.6 category="bottoms" (skirt) only replaces the lower body and
// does NOT touch the upper body — so a jacket applied in a prior step
// is preserved untouched.
//
// Empirically verified (jacket + skirt A/B test):
//   jacket first (tops), then skirt (bottoms) → jacket kept, skirt correct ✅
//   skirt first (bottoms), then jacket (tops) → skirt destroyed, trousers back ❌
//
// tryon-max with a preservation prompt was also tested (skirt first, then
// tryon-max jacket last). The pipeline executed correctly (chain confirmed via
// trace), but tryon-max ignored the preservation prompt and lost the skirt
// anyway. tryon-max prompt adherence is NOT reliable for garment preservation.
//
// Therefore: jacket (tops) BEFORE bottoms. Bottoms win when applied last.
// Exception: Dress/One Piece + Jacket uses tryon-max — see buildTryonPlan().
const LAYER_ORDER: Record<string, number> = {
  "Dress":       0,  // full-body base — applied first
  "One Piece":   0,
  "Top / Shirt": 1,  // upper base layer
  "Jacket":      2,  // outerwear before bottoms — preserves bottom when applied next
  "Other":       2,
  "Pants":       3,  // bottoms applied LAST — v1.6/bottoms preserves upper body
  "Skirt":       3,
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
  category?: FashnCategory;   // present only when useMax === false
  prompt?: string;            // present only when useMax === true
}

/**
 * Build the ordered processing plan for an outfit.
 *
 * The user may select garments in any order; this normalizes them and decides,
 * per garment, which FASHN model applies it:
 *
 *  - All garments → tryon-v1.6 with the matching category, EXCEPT:
 *
 *  - Jacket / Other applied over a Dress / One Piece (connected full-body
 *    garment) → tryon-max + OUTER_LAYER_PROMPT.
 *
 *    Reason: v1.6 category="tops" replaces the upper body region and destroys
 *    the neckline / construction of a connected one-piece. tryon-max with a
 *    prompt is the only FASHN-native approach for this case.
 *
 *    This does NOT apply to Jacket + Pants/Skirt (separable bottoms). A/B
 *    testing and pipeline traces confirmed that for separable bottoms the
 *    correct fix is ordering (jacket before skirt, both v1.6), not tryon-max.
 *    tryon-max was tested for that case and ignored the preservation prompt.
 */
export function buildTryonPlan<T extends { type: ClothingType | string }>(
  items: T[]
): TryonStep<T>[] {
  const sorted = sortByLayer(items);
  const hasConnectedFullBody = sorted.some((g) => CONNECTED_FULLBODY.has(g.type));

  return sorted.map((garment) => {
    const isOuterwear = OUTERWEAR.has(garment.type);
    if (isOuterwear && hasConnectedFullBody) {
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
