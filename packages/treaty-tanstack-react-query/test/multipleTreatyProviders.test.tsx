import type { Treaty } from '@elysiajs/eden/treaty2';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { useState } from 'react';
import { expect, test } from 'vitest';
import { createTreatyContext } from '../src';
import { ok } from './__helpers';

test('recipe: multiple treaty providers with query key prefixing', async () => {
  const billingClient = {
    list: {
      get: async () =>
        ok(['invoice 1']) as Treaty.TreatyResponse<{ 200: string[] }>,
    },
  };
  type BillingClient = typeof billingClient;

  const accountClient = {
    list: {
      get: async () =>
        ok(['account 1']) as Treaty.TreatyResponse<{ 200: string[] }>,
    },
  };
  type AccountClient = typeof accountClient;

  const billing = createTreatyContext<BillingClient, { keyPrefix: true }>();
  const BillingProvider = billing.TreatyProvider;
  const useBilling = billing.useTreaty;

  const account = createTreatyContext<AccountClient, { keyPrefix: true }>();
  const AccountProvider = account.TreatyProvider;
  const useAccount = account.useTreaty;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function App() {
    const [billing] = useState(() => billingClient);
    const [account] = useState(() => accountClient);

    return (
      <QueryClientProvider client={queryClient}>
        <BillingProvider client={billing} queryClient={queryClient} keyPrefix="billing">
          <AccountProvider client={account} queryClient={queryClient} keyPrefix="account">
            <MyComponent />
          </AccountProvider>
        </BillingProvider>
      </QueryClientProvider>
    );
  }

  function MyComponent() {
    const billing = useBilling();
    const account = useAccount();

    const billingList = useQuery(billing.list.queryOptions());
    const accountList = useQuery(account.list.queryOptions());

    return (
      <div>
        <div>Billing: {billingList.data?.join(', ')}</div>
        <div>Account: {accountList.data?.join(', ')}</div>
      </div>
    );
  }

  const utils = render(<App />);

  await waitFor(() => {
    expect(utils.container).toHaveTextContent('Billing: invoice 1');
    expect(utils.container).toHaveTextContent('Account: account 1');
  });

  expect(
    queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey),
  ).toMatchInlineSnapshot(`
    [
      [
        [
          "billing",
        ],
        [
          "list",
        ],
        {
          "type": "query",
        },
      ],
      [
        [
          "account",
        ],
        [
          "list",
        ],
        {
          "type": "query",
        },
      ],
    ]
  `);
});
