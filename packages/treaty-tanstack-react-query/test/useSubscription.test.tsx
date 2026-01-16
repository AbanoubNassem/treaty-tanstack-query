import { testReactResource } from './__helpers';
import { act, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { useSubscription } from '../src';

type EdenWsLike = {
  on: (type: string, listener: (event: any) => void, options?: any) => unknown;
  subscribe: (onMessage: (event: any) => void, options?: any) => unknown;
  close: () => unknown;
};

function createMockWs() {
  const listeners = new Map<string, Set<(event: any) => void>>();
  let onMessage: ((event: any) => void) | null = null;
  let closed = false;

  const ws: EdenWsLike = {
    on(type, listener) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
      return ws;
    },
    subscribe(listener) {
      onMessage = listener;
      return ws;
    },
    close() {
      if (closed) return;
      closed = true;
      for (const listener of listeners.get('close') ?? []) {
        listener({});
      }
      listeners.clear();
      onMessage = null;
    },
  };

  return {
    ws,
    emitOpen() {
      for (const listener of listeners.get('open') ?? []) {
        listener({});
      }
    },
    emitError(error: unknown) {
      for (const listener of listeners.get('error') ?? []) {
        listener(error);
      }
    },
    emitData(data: unknown) {
      onMessage?.({ data });
    },
    isClosed() {
      return closed;
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

const testContext = () => {
  const connections: Array<ReturnType<typeof createMockWs>> = [];

  const client = {
    ws: {
      echo: {
        subscribe: (_opts?: unknown) => {
          const next = createMockWs();
          connections.push(next);
          return next.ws;
        },
      },
    },
  };

  return {
    ...testReactResource(
      client as typeof client & {
        ws: {
          echo: {
            subscribe: () => EdenWsLike;
          };
        };
      },
    ),
    connections,
  };
};

describe('useSubscription', () => {
  test('basic', async () => {
    const ctx = testContext();
    const onDataMock = vi.fn();
    const onErrorMock = vi.fn();

    const { useTreaty } = ctx;

    function MyComponent() {
      const [enabled, setEnabled] = React.useState(true);

      const treaty = useTreaty();
      const result = useSubscription(
        treaty.ws.echo.subscriptionOptions(undefined, {
          enabled,
          onData: (data) => {
            expectTypeOf(data).toExtend<unknown>();
            onDataMock(data);
          },
          onError: onErrorMock,
        }),
      );

      return (
        <>
          <button
            onClick={() => setEnabled((it) => !it)}
            data-testid="toggle-enabled"
          >
            toggle enabled
          </button>
          <div>status:{result.status}</div>
          <div>data:{String(result.data ?? 'NO_DATA')}</div>
        </>
      );
    }

    const utils = ctx.renderApp(<MyComponent />);

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`status:connecting`);
    });

    await waitFor(() => {
      expect(ctx.connections.length).toBe(1);
    });

    const conn = ctx.connections[0]!;
    act(() => {
      conn.emitOpen();
    });

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`status:pending`);
    });

    act(() => {
      conn.emitData(123);
    });

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`data:123`);
    });

    expect(onDataMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledTimes(0);

    fireEvent.click(utils.getByTestId('toggle-enabled'));

    await waitFor(() => {
      expect(conn.isClosed()).toBe(true);
    });
    expect(conn.listenerCount('open')).toBe(0);
    expect(conn.listenerCount('error')).toBe(0);
    expect(conn.listenerCount('close')).toBe(0);
  });

  test('reset', async () => {
    const ctx = testContext();
    const { useTreaty } = ctx;

    function MyComponent() {
      const treaty = useTreaty();
      const result = useSubscription(
        treaty.ws.echo.subscriptionOptions(undefined, {
          onData: () => {
            // noop
          },
        }),
      );

      return (
        <>
          <>status:{result.status}</>
          <>data:{String(result.data ?? 'NO_DATA')}</>
          <button onClick={result.reset} data-testid="reset">
            reset
          </button>
        </>
      );
    }

    const utils = ctx.renderApp(<MyComponent />);

    await waitFor(() => {
      expect(ctx.connections.length).toBe(1);
    });

    act(() => {
      ctx.connections[0]!.emitOpen();
    });
    act(() => {
      ctx.connections[0]!.emitData('a');
    });

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`status:pending`);
      expect(utils.container).toHaveTextContent(`data:a`);
    });

    fireEvent.click(utils.getByTestId('reset'));

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`status:connecting`);
      expect(utils.container).toHaveTextContent(`data:NO_DATA`);
    });

    await waitFor(() => {
      expect(ctx.connections.length).toBe(2);
    });
  });

  test('tracked key', async () => {
    const ctx = testContext();
    const { useTreaty } = ctx;

    function MyComponent() {
      const treaty = useTreaty();
      const result1 = useSubscription(treaty.ws.echo.subscriptionOptions(undefined));
      const result2 = useSubscription(treaty.ws.echo.subscriptionOptions(undefined));

      return (
        <>
          <>status1:{result1.status}</>
          <>status2:{result2.status}</>
          {/* Delay access to result2.data until status1 is resolved */}
          <>data:{result1.data ? result2.data : null}</>
        </>
      );
    }

    const utils = ctx.renderApp(<MyComponent />);

    await waitFor(() => {
      expect(ctx.connections.length).toBe(2);
    });

    act(() => {
      for (const conn of ctx.connections) {
        conn.emitOpen();
      }
    });

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`status1:pending`);
      expect(utils.container).toHaveTextContent(`status2:pending`);
      expect(utils.container).toHaveTextContent(`data:`);
    });

    act(() => {
      for (const conn of ctx.connections) {
        conn.emitData(42);
      }
    });

    await waitFor(() => {
      expect(utils.container).toHaveTextContent(`data:42`);
    });
  });
});
