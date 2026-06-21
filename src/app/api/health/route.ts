export async function GET() {
  return Response.json({
    fashn_api_key: process.env.FASHN_API_KEY ? "configured" : "MISSING",
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "MISSING",
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "MISSING",
  });
}
