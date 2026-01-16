import { treaty } from '@elysiajs/eden';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTreatyOptionsProxy } from '../src';

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...(init ?? {}),
  });
}

describe('eden treaty method dispatch', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  test('mutationOptions() prefers PATCH for param routes', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'PATCH') return jsonResponse('__patched');
      if (method === 'POST') return jsonResponse('__posted');
      return jsonResponse('__other');
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.tasks({ id: 1 }).mutationOptions();
    const data = await opts.mutationFn?.({ status: 'done' });

    expect(data).toBe('__patched');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1]?.method?.toUpperCase()).toBe('PATCH');
  });

  test('mutationOptions() uses POST for non-param routes', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'POST') return jsonResponse('__posted');
      if (method === 'PATCH') return jsonResponse('__patched');
      return jsonResponse('__other');
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.tasks.mutationOptions();
    const data = await opts.mutationFn?.({ title: 'x', description: 'y' });

    expect(data).toBe('__posted');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1]?.method?.toUpperCase()).toBe('POST');
  });

  test('mutationOptions(\"delete\") uses DELETE', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'DELETE') return jsonResponse('__deleted');
      if (method === 'POST') return jsonResponse('__posted');
      return jsonResponse('__other');
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.tasks({ id: 1 }).mutationOptions('delete');
    const data = await opts.mutationFn?.(undefined);

    expect(data).toBe('__deleted');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1]?.method?.toUpperCase()).toBe('DELETE');
  });

  test('.delete.mutationOptions() uses DELETE', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'DELETE') return jsonResponse('__deleted');
      if (method === 'POST') return jsonResponse('__posted');
      return jsonResponse('__other');
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.tasks({ id: 1 }).delete.mutationOptions();
    const data = await opts.mutationFn?.(undefined);

    expect(data).toBe('__deleted');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1]?.method?.toUpperCase()).toBe('DELETE');
  });

  test('mutationOptions() falls back on 405 and caches the resolved method', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'PATCH') return jsonResponse({ message: 'no' }, { status: 405 });
      if (method === 'DELETE') return jsonResponse({ message: 'no' }, { status: 405 });
      if (method === 'PUT') return jsonResponse('__put');
      return jsonResponse({ message: 'no' }, { status: 405 });
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const first = api.api.tasks({ id: 1 }).mutationOptions();
    const firstData = await first.mutationFn?.({ status: 'done' });

    expect(firstData).toBe('__put');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls.map((call) => (call[1]?.method ?? 'GET').toUpperCase())).toEqual([
      'PATCH',
      'DELETE',
      'PUT',
    ]);

    const second = api.api.tasks({ id: 2 }).mutationOptions();
    const secondData = await second.mutationFn?.({ status: 'done' });

    expect(secondData).toBe('__put');
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(fetchSpy.mock.calls[3]?.[1]?.method?.toUpperCase()).toBe('PUT');
  });

  test('queryOptions() falls back to HEAD on 405 and caches the resolved method', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'GET') return jsonResponse({ message: 'no' }, { status: 405 });
      if (method === 'HEAD') return jsonResponse('__headed');
      return jsonResponse({ message: 'no' }, { status: 405 });
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.headOnly.queryOptions();

    const firstData = await opts.queryFn?.({
      queryKey: opts.queryKey,
      signal: new AbortController().signal,
    } as any);

    expect(firstData).toBe('__headed');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls.map((call) => (call[1]?.method ?? 'GET').toUpperCase())).toEqual([
      'GET',
      'HEAD',
    ]);

    const secondData = await opts.queryFn?.({
      queryKey: opts.queryKey,
      signal: new AbortController().signal,
    } as any);

    expect(secondData).toBe('__headed');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect((fetchSpy.mock.calls[2]?.[1]?.method ?? 'GET').toUpperCase()).toBe('HEAD');
  });

  test('.head.queryOptions() uses HEAD', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'HEAD') return jsonResponse('__headed');
      return jsonResponse('__other');
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.headOnly.head.queryOptions();
    const data = await opts.queryFn?.({
      queryKey: opts.queryKey,
      signal: new AbortController().signal,
    } as any);

    expect(data).toBe('__headed');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((fetchSpy.mock.calls[0]?.[1]?.method ?? 'GET').toUpperCase()).toBe('HEAD');
  });

  test('infiniteQueryOptions() falls back to HEAD on 405 and caches the resolved method', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'GET') return jsonResponse({ message: 'no' }, { status: 405 });
      if (method === 'HEAD') return jsonResponse('__headed');
      return jsonResponse({ message: 'no' }, { status: 405 });
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.headOnly.infinite.infiniteQueryOptions({
      query: { cursor: 0 },
    });

    const firstData = await opts.queryFn?.({
      queryKey: opts.queryKey,
      signal: new AbortController().signal,
      pageParam: null,
      direction: 'forward',
    } as any);

    expect(firstData).toBe('__headed');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls.map((call) => (call[1]?.method ?? 'GET').toUpperCase())).toEqual([
      'GET',
      'HEAD',
    ]);

    const secondData = await opts.queryFn?.({
      queryKey: opts.queryKey,
      signal: new AbortController().signal,
      pageParam: null,
      direction: 'forward',
    } as any);

    expect(secondData).toBe('__headed');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect((fetchSpy.mock.calls[2]?.[1]?.method ?? 'GET').toUpperCase()).toBe('HEAD');
  });

  test('.patch.mutationOptions() uses PATCH', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'PATCH') return jsonResponse('__patched');
      return jsonResponse('__other');
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.tasks({ id: 1 }).patch.mutationOptions();
    const data = await opts.mutationFn?.({ status: 'done' });

    expect(data).toBe('__patched');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1]?.method?.toUpperCase()).toBe('PATCH');
  });

  test('.post.mutationOptions() uses POST', async () => {
    const fetchSpy = vi.fn(async (_input: any, init?: RequestInit) => {
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (method === 'POST') return jsonResponse('__posted');
      return jsonResponse('__other');
    });
    globalThis.fetch = fetchSpy as any;

    const client = treaty('http://example.com') as any;
    const queryClient = new QueryClient();
    const api: any = createTreatyOptionsProxy({ client, queryClient } as any);

    const opts = api.api.tasks.post.mutationOptions();
    const data = await opts.mutationFn?.({ title: 'x' });

    expect(data).toBe('__posted');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1]?.method?.toUpperCase()).toBe('POST');
  });
});
