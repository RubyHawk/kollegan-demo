/**
 * Security utilities for HTML sanitization, URL validation, and constant-time comparison.
 *
 * Used by the offer email pipeline and document generator to prevent XSS,
 * email injection, and timing attacks.
 */

import sanitizeHtml from 'sanitize-html';
import { timingSafeEqual } from 'crypto';

// ─── HTML escaping ──────────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Email HTML sanitizer ───────────────────────────────────────────────────────

/**
 * Sanitizes user-provided HTML for safe inclusion in emails.
 * Uses an allowlist approach — only known-safe tags and attributes are kept.
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u',
      'a',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img',
      'span', 'div',
    ],
    allowedAttributes: {
      'a':    ['href', 'title', 'style'],
      'img':  ['src', 'alt', 'title', 'style'],
      'td':   ['style'],
      'th':   ['style'],
      'tr':   ['style'],
      'table': ['style'],
      'div':  ['style'],
      'span': ['style'],
      'p':    ['style'],
      'h1':   ['style'],
      'h2':   ['style'],
      'h3':   ['style'],
      'h4':   ['style'],
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: false,
    // Only allow PNG and JPEG data URIs for images
    transformTags: {
      'img': (tagName, attribs) => {
        const src = attribs.src ?? '';
        if (src.startsWith('data:') &&
            !src.startsWith('data:image/png;base64,') &&
            !src.startsWith('data:image/jpeg;base64,')) {
          return { tagName, attribs: { ...attribs, src: '' } };
        }
        return { tagName, attribs };
      },
    },
  });
}

// ─── URL sanitizer ──────────────────────────────────────────────────────────────

/**
 * Validates and sanitizes a URL, allowing only safe protocols.
 * Returns empty string for dangerous URLs (javascript:, data:text/html, etc.)
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Allow http(s) URLs
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  // Allow safe data URIs (PNG and JPEG only)
  if (trimmed.startsWith('data:image/png;base64,') ||
      trimmed.startsWith('data:image/jpeg;base64,')) {
    return trimmed;
  }

  // Block everything else (javascript:, data:text/html, vbscript:, etc.)
  return '';
}

// ─── Constant-time string comparison ────────────────────────────────────────────

/**
 * Compares two strings in constant time to prevent timing attacks.
 * Returns false if either string is empty.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;

  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  // If lengths differ, still compare to avoid length-based timing leaks
  if (bufA.length !== bufB.length) {
    // Compare bufA against itself to keep timing constant, then return false
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
