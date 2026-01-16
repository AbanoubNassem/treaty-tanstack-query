import { ok, testReactResource } from './__helpers';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import { describe, expect, expectTypeOf, test } from 'vitest';

const testContext = () => {
  const client = {
    posts: {
      byId: {
        get: async (_input: { id: string }) =>
          ok('__result' as const) as Treaty.TreatyResponse<{ 200: '__result' }>,
      },
    },
  };

  return testReactResource(client);
};

describe('useTreatyClient', () => {
  test('fetch and use the client', async () => {
    const ctx = testContext();

    const { useTreatyClient } = ctx;
    function MyComponent() {
      const vanillaClient = useTreatyClient();
      const [fetchedState, setFetchedState] = React.useState('');

      async function fetch() {
        const state = await vanillaClient.posts.byId.get({ id: '1' });
        if (state.error) {
          throw state.error;
        }
        expectTypeOf(state.data).toEqualTypeOf<'__result'>();
        setFetchedState(state.data);
      }

      return (
        <>
          <button data-testid="fetch" onClick={fetch}>
            fetch
          </button>

          <pre>Fetched: {fetchedState}</pre>
        </>
      );
    }

    const utils = ctx.renderApp(<MyComponent />);

    await userEvent.click(utils.getByTestId('fetch'));
    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`Fetched: __result`);
    });
  });
});
