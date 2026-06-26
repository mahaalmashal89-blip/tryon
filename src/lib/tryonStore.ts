import { createClient } from "@/lib/supabase/client";
import type { GarmentDraft } from "@/lib/tryonSession";

export interface SavedTryonSession {
  id: string;
  garments: StoredGarment[];
  result_image_url: string | null;
  created_at: string;
}

// Only serialisable garment fields — no File objects, no blob URLs (zero data retention)
export interface StoredGarment {
  type: string;
  source: "url" | "image";
  url: string; // product URL when source='url', empty string for uploaded files
}

const SAVE_TTL_DAYS = 30;

export async function saveTryonSession(
  garments: GarmentDraft[],
  resultImageUrl: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const storedGarments: StoredGarment[] = garments.map((g) => ({
    type: g.type,
    source: g.source,
    url: g.source === "url" ? g.url : "", // never store uploaded file data
  }));

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SAVE_TTL_DAYS);

  await supabase.from("tryon_sessions").insert({
    user_id: user.id,
    garments: storedGarments as unknown as import("@/lib/types/database").Json,
    result_image_url: resultImageUrl,
    expires_at: expiresAt.toISOString(),
  });
}

export async function loadTryonHistory(): Promise<SavedTryonSession[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tryon_sessions")
    .select("id, garments, result_image_url, created_at")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as unknown as SavedTryonSession[];
}
