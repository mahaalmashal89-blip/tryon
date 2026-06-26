import type { NextConfig } from "next";

const securityHeaders = [
  // Blocks MIME-type sniffing attacks
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Belt-and-suspenders clickjacking protection (CSP frame-ancestors is primary)
  { key: "X-Frame-Options", value: "DENY" },

  // Don't send the full URL as Referer to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Restrict access to browser features not used by the app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },

  // Force HTTPS for 2 years; Vercel already enforces TLS but this header
  // protects users who navigate directly or via bookmarks
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },

  // Content Security Policy
  // Notes:
  //   - script-src needs 'unsafe-inline' because Next.js inlines hydration
  //     scripts; nonce-based CSP is a future hardening step
  //   - font-src is 'self' only — next/font self-hosts Google Fonts at build
  //     time so no external font CDN call is ever made at runtime
  //   - img-src includes https://*.fashn.ai for AI try-on result images
  //   - connect-src includes Supabase REST + WebSocket for auth/DB
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.fashn.ai",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
