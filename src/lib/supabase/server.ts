/**
 * Server-side Supabase client (RSC + Route Handlers + Server Actions).
 * Install: npm install @supabase/supabase-js @supabase/ssr
 * Then replace the stubs below with real values from your Supabase project.
 */

// import { createServerClient } from "@supabase/ssr";
// import { cookies } from "next/headers";
// import type { Database } from "@/lib/types/database";

// export async function createClient() {
//   const cookieStore = await cookies();
//   return createServerClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() { return cookieStore.getAll(); },
//         setAll(cookiesToSet) {
//           try {
//             cookiesToSet.forEach(({ name, value, options }) =>
//               cookieStore.set(name, value, options)
//             );
//           } catch { /* called from RSC – safe to ignore */ }
//         },
//       },
//     }
//   );
// }

export async function createClient() {
  throw new Error(
    "Supabase server client is not configured yet. " +
    "Install @supabase/supabase-js and @supabase/ssr, then uncomment the real implementation."
  );
}
