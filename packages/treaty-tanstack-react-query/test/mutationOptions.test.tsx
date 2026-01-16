import { ok, testReactResource } from './__helpers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import { describe, expect, expectTypeOf, test } from 'vitest';

const testContext = (keyPrefix?: string) => {
  const posts = ['initial'];
  const methodCalls: Array<'patch' | 'delete' | 'put' | 'options' | 'connect'> = [];

  const client = {
    posts: {
      list: {
        get: async () =>
          ok(posts) as Treaty.TreatyResponse<{ 200: string[]; 500: string }>,
      },
      create: {
        post: async (input: { text: string }) => {
          posts.push(input.text);
          return ok('__mutationResult' as const) as Treaty.TreatyResponse<{
            200: '__mutationResult';
            500: string;
          }>;
        },
      },
      byId: {
        patch: async (input: { text: string }) => {
          methodCalls.push('patch');
          return ok('__patched' as const) as Treaty.TreatyResponse<{
            200: '__patched';
            500: string;
          }>;
        },
        put: async (input: { text: string }) => {
          methodCalls.push('put');
          return ok('__put' as const) as Treaty.TreatyResponse<{
            200: '__put';
            500: string;
          }>;
        },
        delete: async () => {
          methodCalls.push('delete');
          return ok('__deleted' as const) as Treaty.TreatyResponse<{
            200: '__deleted';
            500: string;
          }>;
        },
        options: async () => {
          methodCalls.push('options');
          return ok('__options' as const) as Treaty.TreatyResponse<{
            200: '__options';
            500: string;
          }>;
        },
        connect: async () => {
          methodCalls.push('connect');
          return ok('__connect' as const) as Treaty.TreatyResponse<{
            200: '__connect';
            500: string;
          }>;
        },
      },
      createWithSerializable: {
        post: async (input: { text: string }) =>
          ok({
            id: 1,
            text: input.text,
            date: new Date(),
          }) as Treaty.TreatyResponse<{
            200: { id: number; text: string; date: Date };
            500: string;
          }>,
      },
    },
  };

  const ctx = testReactResource(client, {
    keyPrefix: keyPrefix as any,
  });

  return {
    ...ctx,
    methodCalls,
  };
};

describe.each(['userid-123', undefined])(
  'mutationOptions with keyPrefix: %s',
  (keyPrefix) => {
    test('useMutation', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      const calls: string[] = [];

      function MyComponent() {
        const treaty = useTreaty();

        const options = treaty.posts.create.mutationOptions({
          onMutate(variables) {
            expectTypeOf<{ text: string }>(variables);
            calls.push('onMutate');
          },
          onSettled(data) {
            expectTypeOf<'__mutationResult' | undefined>(data);
            calls.push('onSettled');
          },
          onError(_error) {
            calls.push('onError');
          },
          onSuccess(data) {
            expectTypeOf<'__mutationResult'>(data);
            calls.push('onSuccess');
          },
        });
        expect(options.treaty.path).toBe('posts.create');

        const mutation = useMutation(options);

        React.useEffect(() => {
          mutation.mutate({
            text: 'hello',
          });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        if (!mutation.data) {
          return <>...</>;
        }

        type TData = (typeof mutation)['data'];
        expectTypeOf<TData>().toExtend<'__mutationResult'>();

        return <pre>{JSON.stringify(mutation.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__mutationResult`);
      });

      expect(calls).toEqual(['onMutate', 'onSuccess', 'onSettled']);
    });

    test('useMutation with no opts', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      const calls: string[] = [];

      function MyComponent() {
        const treaty = useTreaty();

        const options = treaty.posts.create.mutationOptions();
        expect(options.treaty.path).toBe('posts.create');

        const mutation = useMutation(options);

        React.useEffect(() => {
          calls.push('onMutate');
          mutation.mutate(
            {
              text: 'hello',
            },
            {
              onSettled(data) {
                expectTypeOf<'__mutationResult' | undefined>(data);
                calls.push('onSettled');
              },
              onError(_error) {
                calls.push('onError');
              },
              onSuccess(data) {
                expectTypeOf<'__mutationResult'>(data);
                calls.push('onSuccess');
              },
            },
          );
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        if (!mutation.data) {
          return <>...</>;
        }

        type TData = (typeof mutation)['data'];
        expectTypeOf<TData>().toExtend<'__mutationResult'>();

        return <pre>{JSON.stringify(mutation.data ?? 'n/a', null, 4)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__mutationResult`);
      });

      expect(calls).toEqual(['onMutate', 'onSuccess', 'onSettled']);
    });

    test('optimistic update', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      const calls: string[] = [];

      function MyComponent() {
        const treaty = useTreaty();
        const queryClient = useQueryClient();

        const query = useQuery(treaty.posts.list.queryOptions());

        const mutation = useMutation(
          treaty.posts.create.mutationOptions({
            async onMutate(variables) {
              calls.push('onMutate');
              const queryKey = treaty.posts.list.queryKey();
              await queryClient.cancelQueries({ queryKey });

              const previousData = queryClient.getQueryData(queryKey);
              queryClient.setQueryData(queryKey, (old) => [
                ...(old ?? []),
                variables.text,
              ]);

              return { previousData };
            },
            onError(_err, _variables, context) {
              calls.push('onError');
              queryClient.setQueryData(
                treaty.posts.list.queryKey(),
                context?.previousData,
              );
            },
            onSettled() {
              calls.push('onSettled');
              queryClient.invalidateQueries(treaty.posts.list.queryFilter());
            },
          }),
        );

        React.useEffect(() => {
          mutation.mutate({
            text: 'optimistic',
          });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <pre>{JSON.stringify(query.data)}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);

      await waitFor(() => {
        expect(utils.container).toHaveTextContent(
          JSON.stringify(['initial', 'optimistic']),
        );
      });
      expect(calls).toEqual(['onMutate', 'onSettled']);
    });

    test('method selection (default picks put)', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      function MyComponent() {
        const treaty = useTreaty();

        const mutation = useMutation(
          treaty.posts.byId.mutationOptions({
            onSuccess(data) {
              expectTypeOf(data).toEqualTypeOf<'__put'>();
            },
          }),
        );

        React.useEffect(() => {
          mutation.mutate({ text: 'hello' });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <pre>{mutation.data ?? 'n/a'}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__put`);
      });
      expect(ctx.methodCalls).toEqual(['put']);
    });

    test('method selection (explicit delete)', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      function MyComponent() {
        const treaty = useTreaty();

        const mutation = useMutation(
          treaty.posts.byId.mutationOptions('delete', {
            onSuccess(data) {
              expectTypeOf(data).toEqualTypeOf<'__deleted'>();
            },
          }),
        );

        React.useEffect(() => {
          mutation.mutate(undefined);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <pre>{mutation.data ?? 'n/a'}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__deleted`);
      });
      expect(ctx.methodCalls).toEqual(['delete']);
    });

    test('method selection (explicit patch)', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      function MyComponent() {
        const treaty = useTreaty();

        const mutation = useMutation(
          treaty.posts.byId.mutationOptions('patch', {
            onSuccess(data) {
              expectTypeOf(data).toEqualTypeOf<'__patched'>();
            },
          }),
        );

        React.useEffect(() => {
          mutation.mutate({ text: 'hello' });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <pre>{mutation.data ?? 'n/a'}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__patched`);
      });
      expect(ctx.methodCalls).toEqual(['patch']);
    });

    test('method selection (explicit put)', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      function MyComponent() {
        const treaty = useTreaty();

        const mutation = useMutation(
          treaty.posts.byId.mutationOptions('put', {
            onSuccess(data) {
              expectTypeOf(data).toEqualTypeOf<'__put'>();
            },
          }),
        );

        React.useEffect(() => {
          mutation.mutate({ text: 'hello' });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <pre>{mutation.data ?? 'n/a'}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__put`);
      });
      expect(ctx.methodCalls).toEqual(['put']);
    });

    test('method selection (explicit options)', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      function MyComponent() {
        const treaty = useTreaty();

        const mutation = useMutation(
          treaty.posts.byId.mutationOptions('options', {
            onSuccess(data) {
              expectTypeOf(data).toEqualTypeOf<'__options'>();
            },
          }),
        );

        React.useEffect(() => {
          mutation.mutate(undefined);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <pre>{mutation.data ?? 'n/a'}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__options`);
      });
      expect(ctx.methodCalls).toEqual(['options']);
    });

    test('method selection (explicit connect)', async () => {
      const ctx = testContext(keyPrefix);
      const { useTreaty } = ctx;

      function MyComponent() {
        const treaty = useTreaty();

        const mutation = useMutation(
          treaty.posts.byId.mutationOptions('connect', {
            onSuccess(data) {
              expectTypeOf(data).toEqualTypeOf<'__connect'>();
            },
          }),
        );

        React.useEffect(() => {
          mutation.mutate(undefined);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <pre>{mutation.data ?? 'n/a'}</pre>;
      }

      const utils = ctx.renderApp(<MyComponent />);
      await waitFor(() => {
        expect(utils.container).toHaveTextContent(`__connect`);
      });
      expect(ctx.methodCalls).toEqual(['connect']);
    });
  },
);
