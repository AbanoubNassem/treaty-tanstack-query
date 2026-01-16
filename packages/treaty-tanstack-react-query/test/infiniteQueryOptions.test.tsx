import { ok, testReactResource } from './__helpers';
import {
  useInfiniteQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import { describe, expect, expectTypeOf, test } from 'vitest';

const fixtureData = ['1', '2', '3', '4'];

const testContext = () => {
  const client = {
    posts: {
      byId: {
        get: async (_input: { id: string }) =>
          ok('__result' as const) as Treaty.TreatyResponse<{
            200: '__result';
            500: string;
          }>,
      },
      list: {
        get: async (input?: { cursor?: number; foo?: 'bar'; query?: { cursor?: number } }) => {
          const cursor =
            (input as any)?.cursor ?? (input as any)?.query?.cursor ?? 0;
          return ok({
            items: fixtureData.slice(cursor, cursor + 1),
            next: cursor + 1 > fixtureData.length ? undefined : cursor + 1,
          }) as Treaty.TreatyResponse<{
            200: { items: string[]; next?: number | undefined };
            500: string;
          }>;
        },
      },
    },
  };

  return testReactResource(client);
};

describe('infiniteQueryOptions', () => {
  test('basic', async () => {
    const ctx = testContext();
    const { useTreaty } = ctx;

    function MyComponent() {
      const treaty = useTreaty();
      const queryClient = useQueryClient();
      const [invalidated, setInvalidated] = React.useState(false);

      const queryOptions = treaty.posts.list.infiniteQueryOptions(
        {},
        {
          getNextPageParam(lastPage) {
            expectTypeOf<{
              items: string[];
              next?: number | undefined;
            }>(lastPage);
            return lastPage.next;
          },
        },
      );
      const query1 = useInfiniteQuery(queryOptions);
      expect(queryOptions.treaty.path).toBe('posts.list');
      if (!query1.data) {
        return <>...</>;
      }

      // Type check only - don't actually call setQueryData during render
      // as it would cause an infinite re-render loop
      const _typeCheck = () => {
        queryClient.setQueryData(queryOptions.queryKey, (data) => {
          expectTypeOf<typeof data>(query1.data);
          return data;
        });
      };
      void _typeCheck;

      //
      // Check that query keys have correct types

      const queryKey = treaty.posts.list.infiniteQueryKey({});
      expect(queryOptions.queryKey).toEqual(queryKey);
      expectTypeOf<typeof queryOptions.queryKey>(queryKey);

      const queryData = queryClient.getQueryData(
        treaty.posts.list.infiniteQueryKey({}),
      )!;
      expectTypeOf<typeof query1.data>(queryData);
      expect(query1.data).toEqual(queryData);

      //
      // Check that query filters have correct types

      async function invalidate() {
        await queryClient.invalidateQueries(
          treaty.posts.list.infiniteQueryFilter(
            {},
            {
              predicate(opts) {
                expectTypeOf<unknown>(opts.state.data);
                expect(opts.state.data).toEqual(query1.data);
                return true;
              },
            },
          ),
        );
        setInvalidated(true);
      }

      //
      // Check result data type

      expectTypeOf<
        InfiniteData<
          {
            items: typeof fixtureData;
            next?: number | undefined;
          },
          number | null
        >
      >(query1.data);

      return (
        <>
          <button
            data-testid="fetchMore"
            onClick={() => {
              query1.fetchNextPage();
            }}
          >
            Fetch more
          </button>
          <button
            data-testid="invalidate"
            onClick={invalidate}
            disabled={invalidated}
          >
            invalidate
          </button>
          <button
            data-testid="prefetch"
            onClick={async () => {
              const fetched = await queryClient.fetchInfiniteQuery(queryOptions);
              expectTypeOf<{
                pages: {
                  items: typeof fixtureData;
                  next?: number | undefined;
                }[];
                pageParams: (number | null)[];
              }>(fetched);
              expect(
                fetched.pageParams.some((p) => typeof p === 'undefined'),
              ).toBeFalsy();
            }}
          >
            Fetch
          </button>
          <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>
        </>
      );
    }

    const utils = ctx.renderApp(<MyComponent />);

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
      expect(utils.container).toHaveTextContent(`null`);
      expect(utils.container).not.toHaveTextContent(`undefined`);
    });

    await userEvent.click(utils.getByTestId('fetchMore'));
    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
      expect(utils.container).toHaveTextContent(`[ "2" ]`);
    });

    await userEvent.click(utils.getByTestId('invalidate'));
    await waitFor(() => {
      expect(utils.getByTestId('invalidate')).toBeDisabled();
    });
  });

  test('basic suspense', async () => {
    const ctx = testContext();
    const { useTreaty } = ctx;

    function MyComponent() {
      const treaty = useTreaty();
      const queryClient = useQueryClient();
      const [invalidated, setInvalidated] = React.useState(false);

      const queryOptions = treaty.posts.list.infiniteQueryOptions(
        {},
        {
          getNextPageParam(lastPage) {
            return lastPage.next;
          },
        },
      );
      const query1 = useSuspenseInfiniteQuery(queryOptions);
      expect(queryOptions.treaty.path).toBe('posts.list');

      //
      // Check that query keys have correct types

      expect(queryOptions.queryKey).toEqual(treaty.posts.list.infiniteQueryKey({}));

      const queryData = queryClient.getQueryData(
        treaty.posts.list.infiniteQueryKey({}),
      )!;
      expectTypeOf<typeof query1.data>(queryData);
      expect(query1.data).toEqual(queryData);

      //
      // Check that query filters have correct types

      async function invalidate() {
        await queryClient.invalidateQueries(
          treaty.posts.list.infiniteQueryFilter(
            {},
            {
              predicate(opts) {
                expectTypeOf<unknown>(opts.state.data);
                expect(opts.state.data).toEqual(query1.data);
                return true;
              },
            },
          ),
        );
        setInvalidated(true);
      }

      //
      // Check result data type

      expectTypeOf<
        InfiniteData<
          {
            items: typeof fixtureData;
            next?: number | undefined;
          },
          number | null
        >
      >(query1.data);

      return (
        <>
          <button
            data-testid="fetchMore"
            onClick={() => {
              query1.fetchNextPage();
            }}
          >
            Fetch more
          </button>
          <button
            data-testid="invalidate"
            onClick={invalidate}
            disabled={invalidated}
          >
            invalidate
          </button>
          <button
            data-testid="prefetch"
            onClick={async () => {
              const fetched = await queryClient.fetchInfiniteQuery(queryOptions);
              expectTypeOf<{
                pages: {
                  items: typeof fixtureData;
                  next?: number | undefined;
                }[];
                pageParams: (number | null)[];
              }>(fetched);
              expect(
                fetched.pageParams.some((p) => typeof p === 'undefined'),
              ).toBeFalsy();
            }}
          >
            Fetch
          </button>
          <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>
        </>
      );
    }

    const utils = ctx.renderApp(
      <React.Suspense fallback="loading">
        <MyComponent />
      </React.Suspense>,
    );

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
      expect(utils.container).toHaveTextContent(`null`);
      expect(utils.container).not.toHaveTextContent(`undefined`);
    });
    await userEvent.click(utils.getByTestId('fetchMore'));

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
      expect(utils.container).toHaveTextContent(`[ "2" ]`);
    });
  });

  test('no infinite on non cursor types', async () => {
    const ctx = testContext();
    const { useTreaty } = ctx;

    // intended to be unused
    function Component() {
      const treaty = useTreaty();

      // @ts-expect-error - not an infinite query
      treaty.posts.byId.infiniteQueryOptions({ id: '1' });

      // @ts-expect-error - not an infinite query
      treaty.posts.byId.infiniteQueryKey({ id: '1' });

      // @ts-expect-error - not an infinite query
      treaty.posts.byId.infiniteQueryFilter({ id: '1' });
    }
  });

  test('select', async () => {
    const ctx = testContext();
    const { useTreaty } = ctx;

    function MyComponent() {
      const treaty = useTreaty();
      const queryClient = useQueryClient();

      const queryOptions = treaty.posts.list.infiniteQueryOptions(
        {},
        {
          getNextPageParam(lastPage) {
            return lastPage.next;
          },
          select(opts) {
            return {
              ...opts,
              pages: opts.pages.map((page) => {
                return {
                  ...page,
                  items: page.items,
                  ___selected: true as const,
                };
              }),
            };
          },
        },
      );
      const query1 = useInfiniteQuery(queryOptions);
      expect(queryOptions.treaty.path).toBe('posts.list');
      if (!query1.data) {
        return <>...</>;
      }

      expectTypeOf<
        InfiniteData<
          {
            items: typeof fixtureData;
            next?: number | undefined;
          },
          number | null
        >
      >(query1.data);

      expectTypeOf(query1.data.pages[0]!.___selected).toEqualTypeOf<true>();

      return (
        <>
          <button
            data-testid="fetchMore"
            onClick={() => {
              query1.fetchNextPage();
            }}
          >
            Fetch more
          </button>
          <button
            data-testid="prefetch"
            onClick={async () => {
              const fetched = await queryClient.fetchInfiniteQuery(queryOptions);
              expectTypeOf<{
                pages: {
                  items: typeof fixtureData;
                  next?: number | undefined;
                }[];
                pageParams: (number | null)[];
              }>(fetched);
              expect(
                fetched.pageParams.some((p) => typeof p === 'undefined'),
              ).toBeFalsy();
            }}
          >
            Fetch
          </button>
          <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>
        </>
      );
    }

    const utils = ctx.renderApp(<MyComponent />);

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
      expect(utils.container).toHaveTextContent(`null`);
      expect(utils.container).not.toHaveTextContent(`undefined`);
    });
    await userEvent.click(utils.getByTestId('fetchMore'));

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
      expect(utils.container).toHaveTextContent(`[ "2" ]`);
    });

    await waitFor(() => {
      expect(utils.container).toHaveTextContent('__selected');
    });
  });

  // regression: falsy cursor
  test('falsy cursor', async () => {
    const client = {
      posts: {
        list: {
          get: async (input: { cursor: number; foo: 'bar'; query?: { cursor?: number } }) => {
            const cursor =
              (input as any)?.cursor ?? (input as any)?.query?.cursor ?? 0;
            return ok({
              items: fixtureData.slice(cursor, cursor + 1),
              next: cursor + 1 > fixtureData.length ? undefined : cursor + 1,
            }) as Treaty.TreatyResponse<{
              200: { items: string[]; next?: number | undefined };
            }>;
          },
        },
      },
    };

    const ctx = testReactResource(client);

    const { useTreaty } = ctx;

    function MyComponent() {
      const treaty = useTreaty();
      const queryOptions = treaty.posts.list.infiniteQueryOptions(
        {
          cursor: 0,
          foo: 'bar',
        },
        {
          getNextPageParam(lastPage) {
            return lastPage.next;
          },
        },
      );
      const query1 = useInfiniteQuery(queryOptions);
      expect(queryOptions.treaty.path).toBe('posts.list');
      if (!query1.data) {
        return <>...</>;
      }

      return (
        <>
          <button
            data-testid="fetchMore"
            onClick={() => {
              query1.fetchNextPage();
            }}
          >
            Fetch more
          </button>
          <pre>{JSON.stringify(query1.data ?? 'n/a', null, 4)}</pre>
        </>
      );
    }

    const utils = ctx.renderApp(<MyComponent />);

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
    });

    await userEvent.click(utils.getByTestId('fetchMore'));
    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`[ "1" ]`);
      expect(utils.container).toHaveTextContent(`[ "2" ]`);
    });
  });
});
