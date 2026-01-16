import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/dom';
import '@testing-library/jest-dom/vitest';
import type { RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import type { FeatureFlags, ofFeatureFlags } from '../src';
import type { MutationOptionsOverride } from '../src/internals/mutationOptions';
import { createTreatyContext, createTreatyOptionsProxy } from '../src';

export function ok<TData>(data: TData): Treaty.TreatyResponse<{ 200: TData }> {
  return {
    data: data as any,
    error: null,
    response: new Response(null, { status: 200 }),
    status: 200,
    headers: {},
  } as Treaty.TreatyResponse<{ 200: TData }>;
}

export function testReactResource<
  TClient,
  TExtras extends {
    keyPrefix?: string;
    overrides?: {
      mutations?: MutationOptionsOverride;
    };
  } = {},
>(
  client: TClient,
  opts?: TExtras,
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  type $Flags = undefined extends TExtras['keyPrefix']
    ? ofFeatureFlags<{ keyPrefix: false }>
    : ofFeatureFlags<{ keyPrefix: true }>;

  const keyPrefix = opts?.keyPrefix as any;
  const overrides = opts?.overrides as any;

  const optionsProxyClient = createTreatyOptionsProxy<TClient, $Flags>({
    client,
    queryClient,
    ...(keyPrefix !== undefined ? { keyPrefix } : {}),
    ...(overrides !== undefined ? { overrides } : {}),
  } as any);

  const { TreatyProvider, useTreaty, useTreatyClient, useTreatyUtils } =
    createTreatyContext<TClient, $Flags>();

  function renderApp(ui: React.ReactNode) {
    return render(
      <QueryClientProvider client={queryClient}>
        <TreatyProvider
          client={client}
          queryClient={queryClient}
          {...((keyPrefix !== undefined ? { keyPrefix } : {}) as any)}
          {...((overrides !== undefined ? { overrides } : {}) as any)}
        >
          {ui}
        </TreatyProvider>
      </QueryClientProvider>,
    );
  }

  function rerenderApp(renderResult: RenderResult, ui: React.ReactNode) {
    return renderResult.rerender(
      <QueryClientProvider client={queryClient}>
        <TreatyProvider
          client={client}
          queryClient={queryClient}
          {...((keyPrefix !== undefined ? { keyPrefix } : {}) as any)}
          {...((overrides !== undefined ? { overrides } : {}) as any)}
        >
          {ui}
        </TreatyProvider>
      </QueryClientProvider>,
    );
  }

  async function dispose() {
    queryClient.clear();
  }

  return {
    client,
    queryClient,
    renderApp,
    rerenderApp,
    useTreaty,
    useTreatyClient,
    useTreatyUtils,
    optionsProxyClient,
    async [Symbol.asyncDispose]() {
      await dispose();
    },
    [Symbol.dispose]() {
      queryClient.clear();
    },
  };
}
