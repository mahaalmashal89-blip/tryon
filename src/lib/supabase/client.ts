/**
 * Browser-side Supabase client.
 * Install: npm install @supabase/supabase-js @supabase/ssr
 * Then replace the stubs below with real values from your Supabase project.
 */

// import { createBrowserClient } from "@supabase/ssr";
// import type { Database } from "@/lib/types/database";

// export function createClient() {
//   return createBrowserClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   );
// }

export function createClient() {
  throw new Error(
    "Supabase browser client is not configured yet. " +
    "Install @supabase/supabase-js and @supabase/ssr, then uncomment the real implementation."
  );
}
