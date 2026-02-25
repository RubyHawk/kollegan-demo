/**
 * OpenAPI 3.1 specification for all Elsa AI tool endpoints.
 * Served at GET /api/docs  (JSON)
 * Swagger UI at GET /api/docs/ui
 */

const BASE_URL = process.env.NEXTJS_PUBLIC_URL ?? 'http://localhost:3001';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title:       'Grand Hotel Kollegan — Elsa AI Tool API',
    description: 'REST endpoints called directly by VAPI when Elsa needs to look up rooms, make bookings, or update the CRM.',
    version:     '1.0.0',
    contact: {
      name: 'Grand Hotel Kollegan',
    },
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
      Error: {
        type: 'object',
        properties: {
          error: { type: ['string', 'object'] },
        },
      },
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
        description: 'Rate limit exceeded — too many requests from this client',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      Unauthorized: {
        description: 'Invalid or missing x-vapi-secret header',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      BadRequest: {
        description: 'Validation error — check the request body/params',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
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
