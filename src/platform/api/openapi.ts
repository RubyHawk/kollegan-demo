/**
 * OpenAPI 3.1 specification — Kollegan Agentic Platform API.
 *
 * Source of truth for all public and internal API surfaces.
 * Served as:
 *   GET /api/docs     → JSON spec (machine-readable)
 *   GET /api/docs/ui  → Swagger UI (human-readable)
 *
 * Envelope design:
 *   Success → { data, meta, pagination? }          (ApiResponse schema)
 *   Error   → RFC 9457 Problem Details             (Problem schema)
 *
 * This is the CONTRACT. Changes here require version bumps.
 */

import { BRAND_NAME } from '@shared/branding';
import { openApiAiPaths, openApiTags } from './openapi-ai-paths';
import { openApiComponents } from './openapi-components';

const BASE_URL = process.env.NEXTJS_PUBLIC_URL ?? 'http://localhost:3001';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title:       `${BRAND_NAME} Agentic Platform — AI Tool API`,
    description: [
      'REST API for AI-driven automation, voice agents, and workflow orchestration.',
      '',
      '## Response Format',
      'All successful responses use the standard envelope: `{ data, meta, pagination? }`.',
      'All errors use RFC 9457 Problem Details with `Content-Type: application/problem+json`.',
      '',
      '## LLM Tool Calling',
      'These endpoints are designed for direct consumption by LLM agents (Vapi, n8n, custom ReAct loops).',
      'The `meta.requestId` field enables correlation between tool call results and server logs.',
      'Error responses include `retryable` and `retryAfter` to guide agent retry behaviour.',
      '',
      '## Versioning',
      'The active API version is `2025-11-01`. Specify `Soleria-Version: YYYY-MM-DD` to pin a version.',
      'The version used is echoed in every response `meta.version` field.',
    ].join('\n'),
    version: '2025-11-01',
    contact: { name: `${BRAND_NAME} Platform Team` },
  },
  servers: [
    { url: BASE_URL, description: 'Active deployment' },
  ],
  security: [
    { vapiSecret: [] },
  ],
  components: openApiComponents,
  paths: openApiAiPaths,
  tags: openApiTags,
} as const;