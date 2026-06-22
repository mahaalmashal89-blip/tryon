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
          height: string | null;
          weight: string | null;
          waist: string | null;
          hips: string | null;
          bust: string | null;
          usual_size: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          gender?: "male" | "female" | null;
          height?: string | null;
          weight?: string | null;
          waist?: string | null;
          hips?: string | null;
          bust?: string | null;
          usual_size?: string | null;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          gender?: "male" | "female" | null;
          height?: string | null;
          weight?: string | null;
          waist?: string | null;
          hips?: string | null;
          bust?: string | null;
          usual_size?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
        Insert: {
          user_id: string;
          name: string;
          clothing_type: string;
          source_url?: string | null;
          image_url?: string | null;
          score?: number | null;
          verdict?: "BUY" | "MAYBE" | "SKIP" | null;
        };
        Update: {
          user_id?: string;
          name?: string;
          clothing_type?: string;
          source_url?: string | null;
          image_url?: string | null;
          score?: number | null;
          verdict?: "BUY" | "MAYBE" | "SKIP" | null;
        };
        Relationships: [];
      };
      tryon_sessions: {
        Row: {
          id: string;
          user_id: string;
          garments: Json;
          result_image_url: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          garments?: Json;
          result_image_url?: string | null;
        };
        Update: {
          garments?: Json;
          result_image_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
