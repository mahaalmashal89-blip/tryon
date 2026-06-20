import type { ClothingType } from "@/lib/types";

export type FashnCategory = "tops" | "bottoms" | "one-piece";

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

/**
 * Sort garments into layering order.
 * If a Dress or One Piece is present, return only that item (it replaces the full outfit).
 */
export function sortByLayer<T extends { type: ClothingType | string }>(items: T[]): T[] {
  const fullBody = items.find((i) => i.type === "Dress" || i.type === "One Piece");
  if (fullBody) return [fullBody];
  return [...items].sort(
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
