import { ok, testReactResource } from './__helpers';
import { skipToken, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import { describe, expect, expectTypeOf, test, vi } from 'vitest';

type Post = {
  id: string;
  title: string;
};

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const testContext = (keyPrefix?: string) => {
  let iterableDeferred = createDeferred<void>();
  const nextIterable = () => {
    iterableDeferred.resolve();
    iterableDeferred = createDeferred();
  };

  const posts: Post[] = [{ id: '1', title: 'Hello world' }];

  const byIdInputs: Array<{ id: string; fetch?: { signal?: AbortSignal } }> =
    [];

  const byIdSpy = vi.fn();

  const client = {
    posts: {
      byId: {
        get: async (input: { id: string; fetch?: { signal?: AbortSignal } }) => {
          byIdSpy();
          byIdInputs.push(input);
          return ok('__result' as const) as Treaty.TreatyResponse<{
            200: '__result';
            404: { message: string };
          }>;
        },
      },
      byIdWithSerializable: {
        get: async (_input: { id: string }) =>
          ok({
            id: 1,
            date: new Date(),
          }) as Treaty.TreatyResponse<{ 200: { id: number; date: Date } }>,
      },
      iterable: {
        get: async () =>
          ok(
            (async function* () {
              for (let i = 0; i < 3; i++) {
                await iterableDeferred.promise;
                yield i + 1;
              }
            })(),
          ) as Treaty.TreatyResponse<{ 200: AsyncGenerator<number, void, unknown> }>,
      },
      list: {
        get: async () => ok(posts) as Treaty.TreatyResponse<{ 200: Post[] }>,
      },
    },
  };

  return {
    ...testReactResource(client, {
      keyPrefix: keyPrefix as any,
    }),
    nextIterable,
    byIdInputs,
    byIdSpy,
  };
};

describe.each(['user-123', undefined])(
  'queryOptions with keyPrefix: %s',
  (keyPrefix) => {
    test('basic', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const queryOptions = treaty.posts.byId.queryOptions({ id: '1' });
        expect(queryOptions.treaty.path).toBe('posts.byId');
        const query1 = useQuery(queryOptions);

        const query2 = useQuery(treaty.posts.byId.queryOptions({ id: '1' }));
        expectTypeOf(query1).toExtend<typeof query2>();

        if (!query1.data) {
          return <>...</>;
        }

        expectTypeOf(query1.data).toExtend<'__result'>();
        expectTypeOf(query1.error).toExtend<
          | { status: 404; value: { message: string } }
          | null
        >();

        return <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__result`);
      });
    });

    test('select', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const queryOptions = treaty.posts.byId.queryOptions(
          { id: '1' },
          {
            select: (data) => `mutated${data}` as const,
          },
        );
        expect(queryOptions.treaty.path).toBe('posts.byId');
        const query1 = useQuery(queryOptions);

        if (!query1.data) {
          return <>...</>;
        }

        expectTypeOf(query1.data).toExtend<'mutated__result'>();

        return <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`mutated__result`);
      });
    });

    test('initialData', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const queryOptions = treaty.posts.byId.queryOptions(
          { id: '1' },
          { initialData: '__result' },
        );
        expect(queryOptions.treaty.path).toBe('posts.byId');
        const query1 = useQuery(queryOptions);

        expectTypeOf(query1.data).toEqualTypeOf<'__result'>();

        return <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__result`);
      });
    });

    test('disabling query with skipToken', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const options = treaty.posts.byId.queryOptions(skipToken);
        const query1 = useQuery(options);

        const query2 = useQuery(treaty.posts.byId.queryOptions(skipToken));

        expectTypeOf(query1.data).toExtend<'__result' | undefined>();
        expectTypeOf(query2.data).toExtend<'__result' | undefined>();

        return <pre>{query1.status}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`pending`);
      });
    });

    test('with `treaty.abortOnUnmount`', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const queryOptions = treaty.posts.byId.queryOptions(
          { id: '1' },
          { treaty: { abortOnUnmount: true } },
        );
        expect(queryOptions.treaty.path).toBe('posts.byId');
        const query1 = useQuery(queryOptions);

        if (!query1.data) {
          return <>...</>;
        }

        expectTypeOf(query1.data).toExtend<'__result'>();

        return <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__result`);
      });

      expect(ctx.byIdInputs.length).toBeGreaterThan(0);
      expect(ctx.byIdInputs[0]?.fetch?.signal).toBeInstanceOf(AbortSignal);
    });

    test('iterable', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      const states: {
        status: string;
        data: unknown;
        fetchStatus: string;
      }[] = [];
      const selects: number[][] = [];

      function MyComponent() {
        const treaty = useTreaty();
        const opts = treaty.posts.iterable.queryOptions(undefined, {
          select(data) {
            expectTypeOf<number[]>(data);
            selects.push(data);
            return data;
          },
        });
        const query1 = useQuery(opts);
        states.push({
          status: query1.status,
          data: query1.data,
          fetchStatus: query1.fetchStatus,
        });
        ctx.nextIterable();

        expectTypeOf(query1.data).toEqualTypeOf<undefined | number[]>();

        return (
          <pre>
            {query1.status}:{query1.fetchStatus}
          </pre>
        );
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`success:idle`);
      });

      expect(selects).toEqual([
        [],
        [],
        [1],
        [1],
        [1, 2],
        [1, 2],
        [1, 2, 3],
        [1, 2, 3],
      ]);

      expect(states.map((s) => [s.status, s.fetchStatus])).toEqual([
        // initial
        ['pending', 'fetching'],
        // waiting 3 values
        ['success', 'fetching'],
        ['success', 'fetching'],
        ['success', 'fetching'],
        // done iterating
        ['success', 'idle'],
      ]);
      expect(states).toMatchSnapshot();
    });

    test('useSuspenseQuery', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const { data } = useSuspenseQuery(
          treaty.posts.byId.queryOptions({ id: '1' }),
        );

        expectTypeOf(data).toExtend<'__result'>();

        return <pre>{JSON.stringify(data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__result`);
      });
    });

    test('fetchQuery calls the client', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const ctx = testContext(keyPrefix);

      const post = await ctx.queryClient.fetchQuery(
        ctx.optionsProxyClient.posts.byId.queryOptions({ id: '1' }),
      );

      expect(post).toEqual('__result');
      expect(ctx.byIdSpy).toHaveBeenCalledTimes(1);

      expect(fetchSpy).toHaveBeenCalledTimes(0);
    });

    test('initialData inference', async () => {
      const ctx = testContext(keyPrefix);

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const queryOptions = treaty.posts.list.queryOptions(undefined, {
          initialData: [],
        });
        expect(queryOptions.treaty.path).toBe('posts.list');
        const query1 = useQuery(queryOptions);

        expectTypeOf(query1.data).toEqualTypeOf<Post[]>();

        return <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent('Hello world');
      });
    });

    test('initialData inference + select', async () => {
      const ctx = testContext(keyPrefix);
      const noPostSymbol = Symbol('noPost');

      const { useTreaty } = ctx;
      function MyComponent() {
        const treaty = useTreaty();
        const queryOptions = treaty.posts.list.queryOptions(undefined, {
          initialData: [],
          select: (data) => data.at(0) ?? noPostSymbol,
        });
        expect(queryOptions.treaty.path).toBe('posts.list');
        const query1 = useQuery(queryOptions);

        expectTypeOf(query1.data).toEqualTypeOf<Post | typeof noPostSymbol>();

        return <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent('Hello world');
      });
    });
  },
);
