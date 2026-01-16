import { ok, testReactResource } from './__helpers';
import { useQuery } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import type { Treaty } from '@elysiajs/eden/treaty2';
import * as React from 'react';
import { describe, expect, expectTypeOf, test } from 'vitest';

type User = {
  id: number;
  name: string;
};

/**
 * Test that HTTP method names (get, post, etc.) work correctly as path segments.
 * For example, an endpoint like /api/get/users should work where 'get' is a path segment,
 * not the HTTP method.
 */
describe('HTTP method names as path segments', () => {
  // Create a client structure that mimics /api/get/users
  // where 'get' is a PATH SEGMENT, not the HTTP method
  const client = {
    api: {
      // 'get' here is a PATH SEGMENT (like /api/get/...)
      get: {
        users: {
          // This 'get' is the actual HTTP method
          get: async () =>
            ok([{ id: 1, name: 'John' }]) as Treaty.TreatyResponse<{
              200: User[];
            }>,
        },
      },
      // Regular path for comparison
      users: {
        get: async () =>
          ok([{ id: 2, name: 'Jane' }]) as Treaty.TreatyResponse<{
            200: User[];
          }>,
      },
      // 'post' as a path segment
      post: {
        items: {
          get: async () =>
            ok(['item1', 'item2']) as Treaty.TreatyResponse<{
              200: string[];
            }>,
        },
      },
      // 'delete' as a path segment
      delete: {
        records: {
          get: async () =>
            ok([{ deleted: true }]) as Treaty.TreatyResponse<{
              200: { deleted: boolean }[];
            }>,
        },
      },
    },
  };

  const ctx = testReactResource(client);

  test('can access path segment named "get"', async () => {
    const { useTreaty, renderApp } = ctx;

    function MyComponent() {
      const treaty = useTreaty();

      // Access /api/get/users - 'get' is a path segment
      const queryOptions = treaty.api.get.users.queryOptions();

      // Verify the path is correct
      expect(queryOptions.treaty.path).toBe('api.get.users');

      const query = useQuery(queryOptions);

      // Type should be User[]
      expectTypeOf(query.data).toExtend<User[] | undefined>();

      if (!query.data) return <>Loading...</>;
      return <div>Users: {query.data.length}</div>;
    }

    const { container } = renderApp(<MyComponent />);
    await waitFor(() => {
      expect(container).toHaveTextContent('Users: 1');
    });
  });

  test('can access path segment named "post"', async () => {
    const { useTreaty, renderApp } = ctx;

    function MyComponent() {
      const treaty = useTreaty();

      // Access /api/post/items - 'post' is a path segment
      const queryOptions = treaty.api.post.items.queryOptions();

      expect(queryOptions.treaty.path).toBe('api.post.items');

      const query = useQuery(queryOptions);

      expectTypeOf(query.data).toExtend<string[] | undefined>();

      if (!query.data) return <>Loading...</>;
      return <div>Items: {query.data.join(', ')}</div>;
    }

    const { container } = renderApp(<MyComponent />);
    await waitFor(() => {
      expect(container).toHaveTextContent('Items: item1, item2');
    });
  });

  test('can access path segment named "delete"', async () => {
    const { useTreaty, renderApp } = ctx;

    function MyComponent() {
      const treaty = useTreaty();

      // Access /api/delete/records - 'delete' is a path segment
      const queryOptions = treaty.api.delete.records.queryOptions();

      expect(queryOptions.treaty.path).toBe('api.delete.records');

      const query = useQuery(queryOptions);

      if (!query.data) return <>Loading...</>;
      return <div>Deleted: {query.data[0]?.deleted ? 'yes' : 'no'}</div>;
    }

    const { container } = renderApp(<MyComponent />);
    await waitFor(() => {
      expect(container).toHaveTextContent('Deleted: yes');
    });
  });

  test('regular paths still work alongside method-named paths', async () => {
    const { useTreaty, renderApp } = ctx;

    function MyComponent() {
      const treaty = useTreaty();

      // Regular /api/users path
      const regularQuery = useQuery(treaty.api.users.queryOptions());

      // /api/get/users path (get is path segment)
      const getPathQuery = useQuery(treaty.api.get.users.queryOptions());

      if (!regularQuery.data || !getPathQuery.data) return <>Loading...</>;

      return (
        <div>
          Regular: {regularQuery.data[0]?.name}, GetPath:{' '}
          {getPathQuery.data[0]?.name}
        </div>
      );
    }

    const { container } = renderApp(<MyComponent />);
    await waitFor(() => {
      expect(container).toHaveTextContent('Regular: Jane, GetPath: John');
    });
  });

  test('queryKey includes path segment correctly', () => {
    const { useTreaty, renderApp } = ctx;

    function MyComponent() {
      const treaty = useTreaty();

      const queryKey = treaty.api.get.users.queryKey();

      // The path should include 'get' as a path segment
      expect(queryKey[0]).toEqual(['api', 'get', 'users']);

      return <div>Key checked</div>;
    }

    renderApp(<MyComponent />);
  });
});
