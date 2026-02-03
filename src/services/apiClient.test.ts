import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type FetchArgs = Parameters<typeof fetch>;

function mockLocalStorage(initial: Record<string, string> = {}) {
  let store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  } as Storage;
}

describe('apiClient Authorization header', () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = (globalThis as any).localStorage;

  beforeEach(() => {
    (globalThis as any).localStorage = mockLocalStorage();
    globalThis.fetch = vi.fn(async (..._args: FetchArgs) => {
      return new Response(JSON.stringify({ success: true, requests: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as any).localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  it('sends Authorization for internal-* token', async () => {
    localStorage.setItem('token', 'internal-123e4567-e89b-12d3-a456-426614174000-1700000000000');
    const { apiGet } = await import('./apiClient');

    await apiGet('/auth/registration-requests');

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [_url, options] = fetchMock.mock.calls[0];
    const headers = (options?.headers || {}) as Record<string, string>;
    expect(headers.Authorization).toBe(
      'Bearer internal-123e4567-e89b-12d3-a456-426614174000-1700000000000'
    );
  });

  it('sends Authorization for JWT token', async () => {
    localStorage.setItem('token', 'aaa.bbb.ccc');
    const { apiGet } = await import('./apiClient');

    await apiGet('/auth/registration-requests');

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const [_url, options] = fetchMock.mock.calls[0];
    const headers = (options?.headers || {}) as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer aaa.bbb.ccc');
  });

  it('does not send Authorization for unsupported non-JWT token', async () => {
    localStorage.setItem('token', 'token-abc');
    const { apiGet } = await import('./apiClient');

    await apiGet('/auth/registration-requests');

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const [_url, options] = fetchMock.mock.calls[0];
    const headers = (options?.headers || {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

