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
 *   Error   → RFC 7807 Problem Details             (Problem schema)
 *
 * This is the CONTRACT. Changes here require version bumps.
 */

const BASE_URL = process.env.NEXTJS_PUBLIC_URL ?? 'http://localhost:3001';
const PROBLEM_BASE = 'https://docs.kollegan.ai/problems';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title:       'Kollegan Agentic Platform — AI Tool API',
    description: [
      'REST API for AI-driven automation, voice agents, and workflow orchestration.',
      '',
      '## Response Format',
      'All successful responses use the standard envelope: `{ data, meta, pagination? }`.',
      'All errors use RFC 7807 Problem Details with `Content-Type: application/problem+json`.',
      '',
      '## LLM Tool Calling',
      'These endpoints are designed for direct consumption by LLM agents (Vapi, n8n, custom ReAct loops).',
      'The `meta.requestId` field enables correlation between tool call results and server logs.',
      'Error responses include `retryable` and `retryAfter` to guide agent retry behaviour.',
      '',
      '## Versioning',
      'The active API version is `2025-11-01`. Specify `Kollegan-Version: YYYY-MM-DD` to pin a version.',
      'The version used is echoed in every response `meta.version` field.',
    ].join('\n'),
    version: '2025-11-01',
    contact: { name: 'Kollegan Platform Team' },
  },
  servers: [
    { url: BASE_URL, description: 'Active deployment' },
  ],
  security: [
    { vapiSecret: [] },
  ],
  components: {
    securitySchemes: {
      vapiSecret: {
        type: 'apiKey',
        in:   'header',
        name: 'x-vapi-secret',
        description: 'Shared secret from VAPI_WEBHOOK_SECRET environment variable. Set in VAPI dashboard tool server headers.',
      },
    },
    schemas: {
      // ── Platform envelope schemas ──────────────────────────────────────────

      RequestMeta: {
        type: 'object',
        description: 'Present on every successful response. Enables tracing, versioning, and performance observability.',
        required: ['requestId', 'timestamp', 'version', 'durationMs'],
        properties: {
          requestId:  { type: 'string', example: 'req_lk5s8f2a', description: 'Unique request ID — correlate with X-Request-Id header and server logs' },
          timestamp:  { type: 'string', format: 'date-time', description: 'ISO 8601 UTC timestamp of request receipt' },
          version:    { type: 'string', example: '2025-11-01', description: 'API version used to process this request' },
          durationMs: { type: 'integer', example: 42, description: 'Server-side processing time in milliseconds' },
        },
      },

      Pagination: {
        type: 'object',
        description: 'Cursor-based pagination metadata. Present when the response is a list.',
        required: ['count', 'hasNext', 'hasPrev'],
        properties: {
          total:      { type: 'integer', description: 'Total matching records (may be omitted for large datasets)' },
          count:      { type: 'integer', description: 'Number of items in this page' },
          hasNext:    { type: 'boolean' },
          hasPrev:    { type: 'boolean' },
          nextCursor: { type: 'string', description: 'Pass as ?cursor= to fetch the next page' },
          prevCursor: { type: 'string' },
        },
      },

      ValidationIssue: {
        type: 'object',
        required: ['field', 'message', 'code'],
        properties: {
          field:   { type: 'string', example: 'email', description: 'Dot-separated field path; "_root" for top-level errors' },
          message: { type: 'string', example: 'Invalid email address' },
          code:    { type: 'string', example: 'invalid_string', description: 'Machine-readable Zod issue code' },
        },
      },

      Problem: {
        type: 'object',
        description: 'RFC 7807 Problem Details — all error responses use this shape.',
        required: ['type', 'title', 'status', 'detail', 'timestamp', 'retryable'],
        properties: {
          type:        { type: 'string', format: 'uri', example: `${PROBLEM_BASE}/validation-error`, description: 'Stable URI identifying the problem type' },
          title:       { type: 'string', example: 'Validation Error', description: 'Short summary — same for all instances of this problem type' },
          status:      { type: 'integer', example: 400 },
          detail:      { type: 'string', example: 'Request body failed validation', description: 'Human-readable explanation of this specific occurrence' },
          instance:    { type: 'string', example: '/api/ai/crm/update', description: 'URI of the failing endpoint' },
          requestId:   { type: 'string', example: 'req_lk5s8f2a', description: 'Correlate with logs' },
          timestamp:   { type: 'string', format: 'date-time' },
          errors:      { type: 'array', items: { '$ref': '#/components/schemas/ValidationIssue' }, description: 'Field-level validation issues (only on 400 validation errors)' },
          retryable:   { type: 'boolean', description: 'Whether retrying with the same request may succeed' },
          retryAfter:  { type: 'integer', description: 'Seconds to wait before retrying (when retryable=true)' },
        },
      },

      // ── Generic wrapped response ─────────────────────────────────────────
      // Per-endpoint schemas extend this pattern: { data: <specific schema>, meta, pagination? }

      // ── Domain schemas ─────────────────────────────────────────────────────
      Room: {
        type: 'object',
        properties: {
          id:     { type: 'string', example: '101' },
          type:   { type: 'string', enum: ['Enkel', 'Dubbel', 'Svit'] },
          floor:  { type: 'integer', example: 1 },
          number: { type: 'integer', example: 101 },
        },
      },
      AvailabilityResult: {
        type: 'object',
        properties: {
          rooms:   { type: 'array', items: { '$ref': '#/components/schemas/Room' } },
          count:   { type: 'integer' },
          filters: { type: 'object' },
        },
      },
      BookingResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          room:    { '$ref': '#/components/schemas/Room' },
        },
      },
      CrmUpdateResult: {
        type: 'object',
        properties: {
          success:     { type: 'boolean' },
          message:     { type: 'string' },
          customerId:  { type: 'string' },
          crmRecordId: { type: 'string' },
        },
      },
    },
    responses: {
      RateLimited: {
        description: 'Rate limit exceeded — too many requests. Check Retry-After header.',
        headers: {
          'X-RateLimit-Limit':     { schema: { type: 'integer' }, description: 'Configured limit for this endpoint' },
          'X-RateLimit-Remaining': { schema: { type: 'integer' }, description: 'Requests remaining in the current window' },
          'X-RateLimit-Reset':     { schema: { type: 'integer' }, description: 'Unix timestamp (ms) when the window resets' },
          'Retry-After':           { schema: { type: 'integer' }, description: 'Seconds to wait before retrying' },
        },
        content: { 'application/problem+json': { schema: { '$ref': '#/components/schemas/Problem' } } },
      },
      Unauthorized: {
        description: 'Invalid or missing authentication credentials',
        content: { 'application/problem+json': { schema: { '$ref': '#/components/schemas/Problem' } } },
      },
      BadRequest: {
        description: 'Validation error — the request body or query params are invalid',
        content: { 'application/problem+json': { schema: { '$ref': '#/components/schemas/Problem' } } },
      },
      Conflict: {
        description: 'Resource state conflict — check current state and retry',
        content: { 'application/problem+json': { schema: { '$ref': '#/components/schemas/Problem' } } },
      },
      InternalError: {
        description: 'Unexpected server error — retryable with exponential backoff',
        content: { 'application/problem+json': { schema: { '$ref': '#/components/schemas/Problem' } } },
      },
    },
  },
  paths: {
    '/api/ai/availability/check': {
      get: {
        summary:     'Check room availability',
        operationId: 'getAvailableRooms',
        tags:        ['Availability'],
        parameters: [
          { name: 'check_in',  in: 'query', schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, description: 'Arrival date YYYY-MM-DD' },
          { name: 'check_out', in: 'query', schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, description: 'Departure date YYYY-MM-DD' },
          { name: 'type',      in: 'query', schema: { type: 'string', enum: ['Enkel', 'Dubbel', 'Svit'] }, description: 'Room type filter' },
        ],
        responses: {
          '200': { description: 'List of available rooms', content: { 'application/json': { schema: { '$ref': '#/components/schemas/AvailabilityResult' } } } },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
      post: {
        summary:     'Check room availability (POST)',
        operationId: 'postAvailableRooms',
        tags:        ['Availability'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  check_in:  { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                  check_out: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                  type:      { type: 'string', enum: ['Enkel', 'Dubbel', 'Svit'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'List of available rooms', content: { 'application/json': { schema: { '$ref': '#/components/schemas/AvailabilityResult' } } } },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/rooms/lock': {
      post: {
        summary:     'Lock a room during an active call',
        operationId: 'lockRoom',
        tags:        ['Bookings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['room_id'],
                properties: {
                  room_id: { type: 'string', example: '101', description: 'Room number to lock' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Room locked successfully', content: { 'application/json': { schema: { '$ref': '#/components/schemas/BookingResult' } } } },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '409': { description: 'Room not available to lock', content: { 'application/json': { schema: { '$ref': '#/components/schemas/BookingResult' } } } },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/rooms/cancel': {
      post: {
        summary:     'Cancel a booking or release a locked room',
        operationId: 'cancelBooking',
        tags:        ['Bookings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['room_id'],
                properties: {
                  room_id: { type: 'string', example: '101' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Booking cancelled', content: { 'application/json': { schema: { '$ref': '#/components/schemas/BookingResult' } } } },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '409': { description: 'Cancellation not possible', content: { 'application/json': { schema: { '$ref': '#/components/schemas/BookingResult' } } } },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/calendar/check': {
      post: {
        summary:     'Check Google Calendar for conflicts in a date range',
        operationId: 'checkCalendar',
        tags:        ['Calendar'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['check_in', 'check_out'],
                properties: {
                  check_in:  { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                  check_out: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Calendar events in range',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    events:       { type: 'array' },
                    hasConflicts: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/calendar/book': {
      post: {
        summary:     'Atomic lock + confirm booking with Google Calendar event',
        operationId: 'bookRoom',
        tags:        ['Calendar'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['room_id', 'guest_name'],
                properties: {
                  room_id:    { type: 'string', example: '101' },
                  guest_name: { type: 'string', example: 'Anna Svensson' },
                  check_in:   { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                  check_out:  { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Booking confirmed', content: { 'application/json': { schema: { '$ref': '#/components/schemas/BookingResult' } } } },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '409': { description: 'Room not available', content: { 'application/json': { schema: { '$ref': '#/components/schemas/BookingResult' } } } },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/crm/update': {
      post: {
        summary:     'Save customer details and call summary to CRM',
        operationId: 'updateCRM',
        tags:        ['CRM'],
        description: 'Call at end of every VAPI call. At least one of name, phone, or email is required.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name:            { type: 'string', maxLength: 100 },
                  phone:           { type: 'string', maxLength: 30 },
                  email:           { type: 'string', format: 'email' },
                  company:         { type: 'string', maxLength: 100 },
                  notes:           { type: 'string', maxLength: 1000 },
                  summary:         { type: 'string', maxLength: 2000, description: 'Brief summary of the call' },
                  booked_room_ids: { type: 'array', items: { type: 'string' }, description: 'Room IDs booked in this call' },
                  vapi_call_id:    { type: 'string', description: 'VAPI call ID to link transcript' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'CRM updated', content: { 'application/json': { schema: { '$ref': '#/components/schemas/CrmUpdateResult' } } } },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/customer/get': {
      post: {
        summary:     'Look up a returning customer by phone or name',
        operationId: 'getCustomer',
        tags:        ['CRM'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: { type: 'string', maxLength: 30 },
                  name:  { type: 'string', maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Customer lookup result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    found:    { type: 'boolean' },
                    customer: { type: ['object', 'null'] },
                  },
                },
              },
            },
          },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/hotel-info': {
      get: {
        summary:     'Get live hotel info — rooms, restaurants, activities, amenities',
        operationId: 'getHotelInfo',
        tags:        ['Hotel'],
        responses: {
          '200': { description: 'Hotel information snapshot' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
      post: {
        summary:     'Get live hotel info (POST)',
        operationId: 'postHotelInfo',
        tags:        ['Hotel'],
        responses: {
          '200': { description: 'Hotel information snapshot' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },

    '/api/ai/transcripts/start': {
      post: {
        summary:     'Create a call transcript record at the start of a VAPI call',
        operationId: 'startTranscript',
        tags:        ['Transcripts'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vapi_call_id'],
                properties: {
                  vapi_call_id: { type: 'string', description: 'VAPI call ID' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Transcript created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:      { type: 'boolean' },
                    transcriptId: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '429': { '$ref': '#/components/responses/RateLimited' },
        },
      },
    },
  },
  tags: [
    { name: 'Availability', description: 'Room availability queries' },
    { name: 'Bookings',     description: 'Lock and cancel room bookings' },
    { name: 'Calendar',     description: 'Google Calendar integration' },
    { name: 'CRM',          description: 'Customer relationship management' },
    { name: 'Hotel',        description: 'General hotel information' },
    { name: 'Transcripts',  description: 'Call transcript lifecycle' },
  ],
} as const;
