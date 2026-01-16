import { ok, testReactResource } from './__helpers';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import { useState } from 'react';
import { assertType, describe, expect, expectTypeOf, test } from 'vitest';
import {
  createTreatyContext,
  type AnyTreatyQueryKey,
  type TreatyMutationKeyWithoutPrefix,
  type TreatyMutationKeyWithPrefix,
  type TreatyQueryKeyWithoutPrefix,
  type TreatyQueryKeyWithPrefix,
} from '../src';

const testContext = (opts?: { keyPrefix?: string }) => {
  const client = {
    bluesky: {
      posts: {
        byId: {
          get: async (input: { id: string }) =>
            ok('__result' as const) as Treaty.TreatyResponse<{
              200: '__result';
              404: { message: string };
            }>,
        },
        create: {
          post: async () =>
            ok('__mutationResult' as const) as Treaty.TreatyResponse<{
              200: '__mutationResult';
              500: string;
            }>,
        },
      },
    },
  };

  return testReactResource(client, opts as any);
};

const testContextWithErrorShape = () => {
  const client = {
    bluesky: {
      posts: {
        byId: {
          get: async (input: { id: string }) =>
            ok('__result' as const) as Treaty.TreatyResponse<{
              200: '__result';
              404: { message: string; foo: 1 };
            }>,
        },
        create: {
          post: async () =>
            ok('__mutationResult' as const) as Treaty.TreatyResponse<{
              200: '__mutationResult';
              500: string;
            }>,
        },
      },
    },
  };

  return testReactResource(client);
};

describe('get queryFilter', () => {
  test('gets various query filters', async () => {
    const ctx = testContext();

    const { useTreaty, useTreatyUtils } = ctx;

    function Component() {
      const treaty = useTreaty();
      const utils = useTreatyUtils();

      // @ts-expect-error - path helpers only exist on endpoint nodes
      treaty.pathFilter;
      // @ts-expect-error - path helpers only exist on endpoint nodes
      treaty.bluesky.pathFilter;

      expect(utils.pathFilter()).toMatchInlineSnapshot(`
        {
          "queryKey": [],
        }
      `);
      expect(utils.bluesky.pathFilter()).toMatchInlineSnapshot(`
        {
          "queryKey": [
            [
              "bluesky",
            ],
          ],
        }
      `);
      expect(utils.bluesky.posts.pathFilter()).toMatchInlineSnapshot(`
        {
          "queryKey": [
            [
              "bluesky",
              "posts",
            ],
          ],
        }
      `);
      expect(treaty.bluesky.posts.byId.pathFilter()).toMatchInlineSnapshot(`
        {
          "queryKey": [
            [
              "bluesky",
              "posts",
              "byId",
            ],
          ],
        }
      `);
      expect(treaty.bluesky.posts.byId.queryFilter({ id: '1' }))
        .toMatchInlineSnapshot(`
          {
            "queryKey": [
              [
                "bluesky",
                "posts",
                "byId",
              ],
              {
                "input": {
                  "id": "1",
                },
                "type": "query",
              },
            ],
          }
        `);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });

  test('type inference for query filters', async () => {
    const ctx = testContext();

    const { useTreaty } = ctx;

    function Component() {
      const treaty = useTreaty();
      const query = useQueryClient();

      const a = treaty.bluesky.posts.byId.queryFilter(
        { id: '1' },
        {
          predicate(query) {
            const data = query.setData('__result');
            assertType<unknown>(data);
            assertType<readonly unknown[]>(query.queryKey);

            return true;
          },
        },
      );
      assertType<AnyTreatyQueryKey>(a.queryKey);

      const b = query.getQueryData(a.queryKey);
      assertType<'__result' | undefined>(b);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });
});

describe('get queryKey', () => {
  test('gets various query keys', async () => {
    const ctx = testContext();

    const { useTreaty, useTreatyUtils } = ctx;

    function Component() {
      const treaty = useTreaty();
      const utils = useTreatyUtils();
      const query = useQueryClient();

      // @ts-expect-error - path helpers only exist on endpoint nodes
      treaty.pathKey;
      // @ts-expect-error - path helpers only exist on endpoint nodes
      treaty.bluesky.pathKey;

      query.setQueryData(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
        '__result',
      );

      expect(utils.pathKey()).toMatchInlineSnapshot(`[]`);

      expect(utils.bluesky.pathKey()).toMatchInlineSnapshot(`
        [
          [
            "bluesky",
          ],
        ]
      `);
      expect(utils.bluesky.posts.pathKey()).toMatchInlineSnapshot(`
        [
          [
            "bluesky",
            "posts",
          ],
        ]
      `);
      expect(treaty.bluesky.posts.byId.pathKey()).toMatchInlineSnapshot(`
        [
          [
            "bluesky",
            "posts",
            "byId",
          ],
        ]
      `);
      expect(treaty.bluesky.posts.byId.queryKey({ id: '1' }))
        .toMatchInlineSnapshot(`
          [
            [
              "bluesky",
              "posts",
              "byId",
            ],
            {
              "input": {
                "id": "1",
              },
              "type": "query",
            },
          ]
        `);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });

  test('type inference for query keys', async () => {
    const ctx = testContext();

    const { useTreaty } = ctx;

    function Component() {
      const treaty = useTreaty();
      const query = useQueryClient();

      const a = query.getQueryData(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
      );
      assertType<'__result' | undefined>(a);

      const b = query.setQueryData(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
        '__result',
      );
      assertType<'__result' | undefined>(b);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });

  test('type inference for getQueryState', async () => {
    const ctx = testContext();

    const { useTreaty } = ctx;

    function Component() {
      const treaty = useTreaty();
      const query = useQueryClient();

      const a = query.getQueryState(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
      );
      assertType<'__result' | undefined>(a?.data);
      assertType<
        | { status: 404; value: { message: string } }
        | null
        | undefined
      >(a?.error);

      const b = query.setQueryData(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
        '__result',
      );
      assertType<'__result' | undefined>(b);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });

  test('type inference for getQueryState with defined error shape', async () => {
    const ctx = testContextWithErrorShape();

    const { useTreaty } = ctx;

    function Component() {
      const treaty = useTreaty();
      const query = useQueryClient();

      const a = query.getQueryState(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
      );
      assertType<'__result' | undefined>(a?.data);
      assertType<
        | { status: 404; value: { message: string; foo: 1 } }
        | null
        | undefined
      >(a?.error);

      const b = query.setQueryData(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
        '__result',
      );
      assertType<'__result' | undefined>(b);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });
});

describe('get queryKey with a prefix', () => {
  test('gets various query keys', async () => {
    const ctx = testContext({
      keyPrefix: 'user-123',
    });

    const { useTreaty, useTreatyUtils } = ctx;

    function Component() {
      const treaty = useTreaty();
      const utils = useTreatyUtils();
      const query = useQueryClient();

      query.setQueryData(
        treaty.bluesky.posts.byId.queryKey({ id: '1' }),
        '__result',
      );

      expect(utils.pathKey()).toMatchInlineSnapshot(`
        [
          [
            "user-123",
          ],
        ]
      `);

      expect(utils.bluesky.pathKey()).toMatchInlineSnapshot(`
        [
          [
            "user-123",
          ],
          [
            "bluesky",
          ],
        ]
      `);
      expect(utils.bluesky.posts.pathKey()).toMatchInlineSnapshot(`
        [
          [
            "user-123",
          ],
          [
            "bluesky",
            "posts",
          ],
        ]
      `);
      expect(treaty.bluesky.posts.byId.pathKey()).toMatchInlineSnapshot(`
        [
          [
            "user-123",
          ],
          [
            "bluesky",
            "posts",
            "byId",
          ],
        ]
      `);
      expect(treaty.bluesky.posts.byId.queryKey({ id: '1' }))
        .toMatchInlineSnapshot(`
          [
            [
              "user-123",
            ],
            [
              "bluesky",
              "posts",
              "byId",
            ],
            {
              "input": {
                "id": "1",
              },
              "type": "query",
            },
          ]
        `);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });
});

describe('get mutationKey', () => {
  test('gets various mutation keys', async () => {
    const ctx = testContext();

    const { useTreaty } = ctx;

    function Component() {
      const treaty = useTreaty();

      // @ts-expect-error - not a mutation
      treaty.bluesky.posts.byId.mutationKey;
      // @ts-expect-error - not a mutation
      treaty.bluesky.mutationKey;

      expect(treaty.bluesky.posts.create.mutationKey()).toMatchInlineSnapshot(`
        [
          [
            "bluesky",
            "posts",
            "create",
          ],
        ]
      `);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });
});

describe('get mutationKey with prefix', () => {
  test('gets various mutation keys', async () => {
    const ctx = testContext({
      keyPrefix: 'user-123',
    });

    const { useTreaty } = ctx;

    function Component() {
      const treaty = useTreaty();

      // @ts-expect-error - not a mutation
      treaty.bluesky.posts.byId.mutationKey;
      // @ts-expect-error - not a mutation
      treaty.bluesky.mutationKey;

      expect(treaty.bluesky.posts.create.mutationKey()).toMatchInlineSnapshot(`
        [
          [
            "user-123",
          ],
          [
            "bluesky",
            "posts",
            "create",
          ],
        ]
      `);

      return 'some text';
    }

    ctx.renderApp(<Component />);
  });
});

test('types of testReactResource', async () => {
  const client = {
    q: {
      get: async () =>
        ok('query' as const) as Treaty.TreatyResponse<{ 200: 'query' }>,
    },
    m: {
      post: async () =>
        ok('mutation' as const) as Treaty.TreatyResponse<{ 200: 'mutation' }>,
    },
  };

  {
    const prefix = 'user-123';
    const ctx = testReactResource(client, {
      keyPrefix: prefix,
    });

    const { useTreaty, useTreatyUtils } = ctx;

    function Component() {
      const treaty = useTreaty();
      const utils = useTreatyUtils();

      {
        const key = utils.q.pathKey();

        expectTypeOf<typeof key>().toEqualTypeOf<TreatyQueryKeyWithPrefix>();
        expect(key).toEqual([[prefix], ['q']]);
      }

      {
        const key = treaty.m.mutationKey();
        expectTypeOf<typeof key>().toEqualTypeOf<TreatyMutationKeyWithPrefix>();
        expect(key).toEqual([[prefix], ['m']]);
      }
      return null;
    }
    ctx.renderApp(<Component />);
  }
  {
    const ctx = testReactResource(client);

    const { useTreaty, useTreatyUtils } = ctx;

    function Component() {
      const treaty = useTreaty();
      const utils = useTreatyUtils();
      {
        const key = utils.q.pathKey();

        expectTypeOf<typeof key>().toEqualTypeOf<TreatyQueryKeyWithoutPrefix>();
        expect(key).toEqual([['q']]);
      }
      {
        const key = treaty.m.mutationKey();
        expectTypeOf<typeof key>().toEqualTypeOf<TreatyMutationKeyWithoutPrefix>();
        expect(key).toEqual([['m']]);
      }
      return null;
    }
    ctx.renderApp(<Component />);
  }
});

test('types of normal usage', async () => {
  const client = {} as unknown as {
    q: { get: (opts?: unknown) => Promise<Treaty.TreatyResponse<{ 200: string }>> };
    m: { post: (body?: unknown) => Promise<Treaty.TreatyResponse<{ 200: string }>> };
  };

  {
    const { TreatyProvider } = createTreatyContext<typeof client>();
    function Component() {
      const [queryClient] = useState(() => new QueryClient());
      const [treatyClient] = useState(() => client);

      return (
        <>
          <TreatyProvider
            //
            queryClient={queryClient}
            client={treatyClient}
          >
            {null}
          </TreatyProvider>

          <TreatyProvider
            //
            queryClient={queryClient}
            client={treatyClient}
            // @ts-expect-error - test
            keyPrefix="test"
          >
            {null}
          </TreatyProvider>
        </>
      );
    }
  }

  {
    const { TreatyProvider } = createTreatyContext<
      typeof client,
      { keyPrefix: true }
    >();
    function Component() {
      const [queryClient] = useState(() => new QueryClient());
      const [treatyClient] = useState(() => client);

      return (
        <>
          {/* @ts-expect-error - test keyPrefix */}
          <TreatyProvider
            //
            queryClient={queryClient}
            client={treatyClient}
          >
            {null}
          </TreatyProvider>

          <TreatyProvider
            //
            queryClient={queryClient}
            client={treatyClient}
            keyPrefix="test"
          >
            {null}
          </TreatyProvider>
        </>
      );
    }
  }
});
