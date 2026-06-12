import type { NextConfig } from 'next';

// Allowed CORS origins — comma-separated in env, defaults to app URL
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const primaryOrigin = allowedOrigins[0] ?? 'https://app.kollegan.ai';

const nextConfig: NextConfig = {
  // instrumentation.ts is enabled by default in Next.js 15+
  // Dev-only: allow tenant hostnames (mapped to 127.0.0.1 in /etc/hosts) so
  // host-based branding and the public-site rewrite can be tested locally.
  allowedDevOrigins: ['portal.fluffys.se', 'fluffys.se', 'offert.soleria.se'],

  async headers() {
    return [
      // ── SSE — disable Nginx buffering ───────────────────────────────────────
      {
        source: '/api/sse',
        headers: [{ key: 'X-Accel-Buffering', value: 'no' }],
      },

      // ── Security headers — all routes ──────────────────────────────────────
      // Applied before route-specific headers so they can be overridden if needed.
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer privacy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable unnecessary browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Force HTTPS (1 year, include subdomains)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },

      // ── Content Security Policy ────────────────────────────────────────────
      // Applied to all page routes (not API — APIs don't render HTML).
      // Vapi SDK requires connect-src to include wss://api.vapi.ai.
      {
        source: '/((?!api/).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",  // TailwindCSS v4 / Next.js requires this for now
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              `connect-src 'self' https://api.vapi.ai wss://api.vapi.ai`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },

      // ── CORS — API routes ──────────────────────────────────────────────────
      // Dynamic multi-origin handling is in the middleware (Phase 2).
      // This static header covers the primary origin for preflight responses.
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: primaryOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Request-Id, X-Internal-Key' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
