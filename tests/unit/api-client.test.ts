import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet } from '../../src/shared/lib/api-client';
import { listAnnouncements } from '../../src/shared/lib/api/announcements.api';
import { getProfile } from '../../src/shared/lib/api/auth-account.api';
import { removeCompanyMember } from '../../src/shared/lib/api/companies.api';
import { listCustomers } from '../../src/shared/lib/api/customers.api';
import { createLead } from '../../src/shared/lib/api/leads.api';
import { updateMeeting } from '../../src/shared/lib/api/meetings.api';
import { sendMessage } from '../../src/shared/lib/api/messages.api';
import { deleteProduct, deleteProductCategory } from '../../src/shared/lib/api/products.api';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

describe('api-client', () => {
  it('uses problem detail as the thrown API error message', async () => {
    mockFetch(new Response(JSON.stringify({
      type: 'about:blank',
      title: 'Ogiltig begaran',
      detail: 'Projektet saknar inkopsorder.',
      status: 422,
    }), {
      status: 422,
      headers: { 'content-type': 'application/problem+json' },
    }));

    await expect(apiGet('/api/v1/projekt/project_1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Projektet saknar inkopsorder.',
    });
  });

  it('uses JSON error messages for delete failures', async () => {
    mockFetch(new Response(JSON.stringify({ error: { message: 'Kunde inte ta bort posten.' } }), {
      status: 409,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(apiDelete('/api/v1/companies/company_1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Kunde inte ta bort posten.',
    });
  });

  it('uses legacy JSON string errors as the thrown API error message', async () => {
    mockFetch(new Response(JSON.stringify({ error: 'Nuvarande losenord ar felaktigt.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(apiGet('/api/v1/auth/profile')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Nuvarande losenord ar felaktigt.',
    });
  });
});

describe('feature API clients', () => {
  it('keeps profile reads uncached for theme/profile sync', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: 'user_1' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getProfile()).resolves.toMatchObject({ id: 'user_1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/profile', expect.objectContaining({ cache: 'no-store' }));
  });

  it('treats successful member removal 204 responses as empty success', async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(removeCompanyMember(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    )).resolves.toBeUndefined();
  });

  it('treats successful product delete 204 responses as empty success', async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(deleteProduct('product_1')).resolves.toBeUndefined();
  });

  it('treats successful product category delete 204 responses as empty success', async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(deleteProductCategory('category_1')).resolves.toBeUndefined();
  });

  it('uses v1 customers routes for CRM contact reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { contacts: [], customers: [], total: 0, limit: 8, offset: 0 },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listCustomers({ search: 'anna', limit: 8, offset: 0 })).resolves.toMatchObject({ total: 0 });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/kunder?search=anna&limit=8&offset=0', expect.any(Object));
  });

  it('uses v1 leads routes for lead creation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { lead: { id: 'lead_1', name: 'Anna', status: 'new', source: 'manual' } },
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createLead({ name: 'Anna', status: 'new', source: 'manual' })).resolves.toMatchObject({ id: 'lead_1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/leads', expect.objectContaining({ method: 'POST' }));
  });

  it('uses v1 announcements routes for team-hub reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { announcements: [], total: 0 },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listAnnouncements({ limit: 50, offset: 0 })).resolves.toMatchObject({ total: 0 });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/announcements?limit=50&offset=0', expect.any(Object));
  });

  it('uses v1 meetings routes for meeting updates', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { meeting: { id: 'meeting_1', status: 'completed' } },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateMeeting('meeting_1', { status: 'completed' })).resolves.toMatchObject({ id: 'meeting_1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/meetings/meeting_1', expect.objectContaining({ method: 'PATCH' }));
  });

  it('uses v1 messages routes for sending messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { message: { id: 'message_1', body: 'Hej' } },
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendMessage('conversation_1', { body: 'Hej' })).resolves.toMatchObject({ id: 'message_1' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/messages/conversations/conversation_1/messages',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
