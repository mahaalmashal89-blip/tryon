/**
 * Persists user profile measurements to localStorage.
 * Swap the read/write functions here when Supabase auth is wired up.
 */

const KEY = "tryon_profile";

export interface StoredProfile {
  gender: "male" | "female";
  height: string;
  weight: string;
  bust: string;    // female: Bust  / male: Chest
  waist: string;
  hips: string;    // female: Hips  / male: Shoulders
  size: string;
}

export function saveProfile(data: StoredProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — fail silently
  }
}

export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}
