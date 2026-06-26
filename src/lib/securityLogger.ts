/**
 * Structured security event logger.
 *
 * Outputs one JSON line per event to stdout. On Vercel these lines are captured
 * as structured log entries and queryable in the Vercel dashboard / Log Drains.
 *
 * Rules:
 * - Log security-relevant outcomes only — not every request.
 * - Never include passwords, API keys, image data, or personal information.
 * - The `userId` field is a Supabase UUID; it is not PII on its own.
 */

export type SecurityEvent =
  | "AUTH_FAILURE"           // request had no valid session
  | "RATE_LIMIT_EXCEEDED"    // authenticated user hit the try-on rate limit
  | "INVALID_CATEGORY"       // category value not in allowlist
  | "INVALID_IMAGE_INPUT"    // image failed MIME / format / SSRF validation
  | "UNAUTHORIZED_POLL"      // authenticated user polled a prediction they don't own
  | "DB_ERROR";              // internal DB write failed (not a user error)

export interface SecurityLogEntry {
  ts: string;            // ISO-8601 UTC timestamp
  requestId: string;     // per-request UUID for correlation
  event: SecurityEvent;
  route: string;         // e.g. "POST /api/tryon/run"
  userId: string | null; // Supabase auth UID, or null if unauthenticated
  detail?: string;       // optional safe context string — never user-supplied data
}

export function logSecurityEvent(entry: SecurityLogEntry): void {
  // console.log is synchronous and adds no I/O overhead on Vercel serverless.
  console.log(JSON.stringify({ level: "SECURITY", ...entry }));
}

/** Generate a lightweight per-request correlation ID. */
export function newRequestId(): string {
  return crypto.randomUUID();
}
