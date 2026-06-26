const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);


type Result = { ok: true } | { ok: false };

export function validateImageInput(value: unknown): Result {
  if (typeof value !== "string" || value.length === 0) return { ok: false };
  if (value.startsWith("data:")) return validateDataUrl(value);
  return validateUrl(value);
}

function validateDataUrl(value: string): Result {
  const match = /^data:(image\/[a-zA-Z]+);base64,/.exec(value);
  if (!match) return { ok: false };
  if (!ALLOWED_MIME.has(match[1].toLowerCase())) return { ok: false };
  return { ok: true };
}

function validateUrl(value: string): Result {
  let url: URL;
  try { url = new URL(value); } catch { return { ok: false }; }

  // HTTPS only — block file://, ftp://, http://, etc.
  if (url.protocol !== "https:") return { ok: false };

  if (isBlockedHost(url.hostname.toLowerCase())) return { ok: false };

  return { ok: true };
}

function isBlockedHost(host: string): boolean {
  // Node.js on Windows retains IPv6 brackets in url.hostname — strip them
  const h = host.replace(/^\[|\]$/g, "");

  if (h === "localhost" || h === "::1") return true;

  return [
    /^127\./,                          // loopback (127.0.0.1 etc.)
    /^0\.0\.0\.0$/,                    // unspecified address
    /^10\./,                           // RFC 1918 class A private
    /^172\.(1[6-9]|2[0-9]|3[01])\./,  // RFC 1918 class B private
    /^192\.168\./,                     // RFC 1918 class C private
    /^169\.254\./,                     // link-local + cloud metadata (169.254.169.254)
    /^fd[0-9a-f]{2}:/i,               // IPv6 ULA (fc00::/7)
    /^fe80:/i,                         // IPv6 link-local
  ].some((re) => re.test(h));
}
