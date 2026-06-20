/**
 * Supabase database type stubs.
 * Replace this file with the output of `supabase gen types typescript`
 * once the schema is created.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          gender: "male" | "female" | null;
          height_cm: number | null;
          weight_kg: number | null;
          waist_cm: number | null;
          hips_cm: number | null;
          bust_cm: number | null;
          usual_size: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      wardrobe_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          clothing_type: string;
          source_url: string | null;
          image_url: string | null;
          score: number | null;
          verdict: "BUY" | "MAYBE" | "SKIP" | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["wardrobe_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["wardrobe_items"]["Insert"]>;
      };
      tryon_sessions: {
        Row: {
          id: string;
          user_id: string;
          user_photo_url: string | null;
          outfit_items: Json;
          result_image_url: string | null;
          score: number | null;
          verdict: string | null;
          tips: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tryon_sessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tryon_sessions"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
