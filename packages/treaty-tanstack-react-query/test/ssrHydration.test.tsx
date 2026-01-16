import { ok } from './__helpers';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { createTreatyContext, createTreatyOptionsProxy } from '../src';

describe('SSR & Hydration', () => {
  test('server prefetch + dehydrate hydrates into useTreaty().queryOptions()', async () => {
    const users = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ] as const;

    let getCalls = 0;
    const client = {
      api: {
        users: {
          get: async () => {
            getCalls += 1;
            return ok(users);
          },
        },
      },
    };

    const createQueryClient = () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: Infinity,
          },
        },
      });

    const { TreatyProvider, useTreaty } = createTreatyContext<typeof client>();

    function Users() {
      const treaty = useTreaty();
      const query = useQuery(treaty.api.users.queryOptions());

      if (!query.data) return <div>Loading...</div>;

      return (
        <ul>
          {query.data.map((u) => (
            <li key={u.id}>{u.name}</li>
          ))}
        </ul>
      );
    }

    // "Server": prefetch without React context (as shown in docs/guide/ssr.md)
    const serverQueryClient = createQueryClient();
    const serverTreaty = createTreatyOptionsProxy({
      client,
      queryClient: serverQueryClient,
    });

    await serverQueryClient.prefetchQuery(serverTreaty.api.users.queryOptions());
    expect(getCalls).toBe(1);

    const dehydratedState = dehydrate(serverQueryClient);

    // Render on the server with the prefetched cache.
    const serverHtml = renderToString(
      <QueryClientProvider client={serverQueryClient}>
        <HydrationBoundary state={dehydratedState}>
          <TreatyProvider client={client} queryClient={serverQueryClient}>
            <Users />
          </TreatyProvider>
        </HydrationBoundary>
      </QueryClientProvider>,
    );
    expect(serverHtml).toContain('Alice');
    expect(serverHtml).toContain('Bob');

    // "Client": hydrate into a fresh QueryClient and render via the provider hooks.
    const clientQueryClient = createQueryClient();

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const root = hydrateRoot(
      container,
      <QueryClientProvider client={clientQueryClient}>
        <HydrationBoundary state={dehydratedState}>
          <TreatyProvider client={client} queryClient={clientQueryClient}>
            <Users />
          </TreatyProvider>
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(container).toHaveTextContent('Alice');
      expect(container).toHaveTextContent('Bob');
    });

    // With a non-stale cache, hydration should not refetch on mount.
    expect(getCalls).toBe(1);

    // The hydrated cache should contain the prefetched data.
    expect(clientQueryClient.getQueryData(serverTreaty.api.users.queryKey())).toEqual(
      users,
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

