import { ok, testReactResource } from './__helpers';
import { skipToken } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import { describe, expect, test } from 'vitest';

const testContext = () => {
  const client = {
    posts: {
      byId: {
        get: async (_input: { id: string }) =>
          ok('__result' as const) as Treaty.TreatyResponse<{ 200: '__result' }>,
      },
      list: {
        get: async (_input: { cursor: string }) =>
          ok(['__result'] as const) as Treaty.TreatyResponse<{
            200: readonly ['__result'];
          }>,
      },
    },
  };

  return testReactResource(client);
};

describe('skipToken', () => {
  test('various methods honour the skipToken', async () => {
    const ctx = testContext();

    const { useTreaty } = ctx;
    function MyComponent() {
      const treaty = useTreaty();

      const options = treaty.posts.byId.queryOptions(skipToken);
      expect(options.queryFn).toBe(skipToken);

      const options2 = treaty.posts.list.infiniteQueryOptions(skipToken);
      expect(options2.queryFn).toBe(skipToken);

      return <pre>OK</pre>;
    }

    const utils = ctx.renderApp(<MyComponent />);
    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`OK`);
    });
  });
});
