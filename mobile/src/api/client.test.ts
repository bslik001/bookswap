import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/types/api';

vi.mock('@/auth/authStore', () => ({
  authStore: {
    getAccessToken: vi.fn(() => 'access-token'),
    setAccessToken: vi.fn(),
    notifySessionExpired: vi.fn(),
  },
}));

vi.mock('@/auth/tokenStorage', () => ({
  tokenStorage: {
    getRefresh: vi.fn(async () => 'refresh-token'),
    setRefresh: vi.fn(async () => undefined),
    clearRefresh: vi.fn(async () => undefined),
  },
}));

import { api, apiFetch, apiFetchPaginated } from './client';

const mockResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('apiFetch', () => {
  it('unwraps the data field from a successful envelope', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(mockResponse(200, { success: true, data: { id: '1', name: 'A' } }));

    const result = await apiFetch<{ id: string }>('/things/1');

    expect(result).toEqual({ id: '1', name: 'A' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://api.test/api/things/1',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) }),
    );
  });

  it('throws an ApiError with code+status when the server returns an error envelope', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      mockResponse(404, { success: false, error: { code: 'NOT_FOUND', message: 'introuvable' } }),
    );

    await expect(apiFetch('/things/missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});

describe('apiFetchPaginated', () => {
  it('returns { data, meta } when the envelope contains both', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      mockResponse(200, {
        success: true,
        data: [{ id: '1' }, { id: '2' }],
        meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
      }),
    );

    const result = await apiFetchPaginated<{ id: string }>('/things');

    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });

  it('throws when meta is missing (would otherwise crash useInfiniteQuery)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      mockResponse(200, { success: true, data: [{ id: '1' }] }),
    );

    await expect(apiFetchPaginated('/things')).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetchPaginated('/things')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});

describe('api helpers', () => {
  it('serialises POST bodies as JSON', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(mockResponse(201, { success: true, data: { ok: true } }));

    await api.post('/things', { name: 'New' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://api.test/api/things',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('does not set Content-Type when sending FormData', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(mockResponse(201, { success: true, data: { ok: true } }));
    const form = new FormData();
    form.append('field', 'value');

    await api.post('/upload', form);

    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });
});
