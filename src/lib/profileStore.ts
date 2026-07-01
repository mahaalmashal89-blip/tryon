import { createClient } from "@/lib/supabase/client";

export interface StoredProfile {
  gender: "male" | "female";
  height: string;
  weight: string;
  bust: string;    // female: Bust  / male: Chest
  waist: string;
  hips: string;    // female: Hips  / male: Shoulders
  size: string;
}

export async function saveProfile(data: StoredProfile): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    bust: data.bust,
    waist: data.waist,
    hips: data.hips,
    usual_size: data.size,
    updated_at: new Date().toISOString(),
  });
}

export async function loadProfile(): Promise<StoredProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("gender, height, weight, bust, waist, hips, usual_size")
    .eq("id", user.id)
    .single();

  if (!data) {
    // No profile row yet (user skipped setup or setup hasn't saved).
    // Fall back to the gender stored in auth metadata at signup — same
    // logic ProfileSetup.tsx already uses on first load.
    const raw = String(user.user_metadata?.gender ?? "").toLowerCase();
    const metaGender: "male" | "female" | null =
      raw === "male" ? "male" : raw === "female" ? "female" : null;
    if (!metaGender) return null;
    return { gender: metaGender, height: "", weight: "", bust: "", waist: "", hips: "", size: "" };
  }

  return {
    gender: (data.gender as "male" | "female") ?? "female",
    height: data.height ?? "",
    weight: data.weight ?? "",
    bust:   data.bust   ?? "",
    waist:  data.waist  ?? "",
    hips:   data.hips   ?? "",
    size:   data.usual_size ?? "",
  };
}
