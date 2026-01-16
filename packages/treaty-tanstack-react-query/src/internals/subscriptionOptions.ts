import type { SkipToken } from '@tanstack/react-query';
import { hashKey, skipToken } from '@tanstack/react-query';
import * as React from 'react';
import type {
  DefaultFeatureFlags,
  FeatureFlags,
  ResolverDef,
  TreatyQueryKey,
  TreatyQueryOptionsResult,
} from './types';
import { createTreatyOptionsResult } from './utils';

export interface Unsubscribable {
  unsubscribe: () => void;
}

export type TreatyConnectionState<TError> =
  | { state: 'idle'; error: null }
  | { state: 'connecting'; error: TError | null }
  | { state: 'pending'; error: null };

interface BaseTreatySubscriptionOptionsIn<TOutput, TError> {
  enabled?: boolean;
  onStarted?: () => void;
  onData?: (data: TOutput) => void;
  onError?: (err: TError) => void;
  onConnectionStateChange?: (state: TreatyConnectionState<TError>) => void;
}

interface UnusedSkipTokenTreatySubscriptionOptionsIn<TOutput, TError> {
  onStarted?: () => void;
  onData?: (data: TOutput) => void;
  onError?: (err: TError) => void;
  onConnectionStateChange?: (state: TreatyConnectionState<TError>) => void;
}

interface TreatySubscriptionOptionsOut<
  TOutput,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends UnusedSkipTokenTreatySubscriptionOptionsIn<TOutput, TError>,
    TreatyQueryOptionsResult {
  enabled: boolean;
  queryKey: TreatyQueryKey<TFeatureFlags['keyPrefix']>;
  subscribe: (
    innerOpts: UnusedSkipTokenTreatySubscriptionOptionsIn<TOutput, TError>,
  ) => Unsubscribable;
}

export interface TreatySubscriptionOptions<
  TDef extends ResolverDef,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> {
  (
    input: TDef['input'],
    opts?: UnusedSkipTokenTreatySubscriptionOptionsIn<TDef['output'], TDef['error']>,
  ): TreatySubscriptionOptionsOut<TDef['output'], TDef['error'], TFeatureFlags>;
  (
    input: TDef['input'] | SkipToken,
    opts?: BaseTreatySubscriptionOptionsIn<TDef['output'], TDef['error']>,
  ): TreatySubscriptionOptionsOut<TDef['output'], TDef['error'], TFeatureFlags>;

  /**
   * @internal prefer using inferInput and inferOutput to access types
   */
  '~types': {
    input: TDef['input'];
    output: TDef['output'];
    error: TDef['error'];
  };
}

export type TreatySubscriptionStatus = 'idle' | 'connecting' | 'pending' | 'error';

export interface TreatySubscriptionBaseResult<TOutput, TError> {
  status: TreatySubscriptionStatus;
  data: undefined | TOutput;
  error: null | TError;
  reset: () => void;
}

export interface TreatySubscriptionIdleResult<TOutput>
  extends TreatySubscriptionBaseResult<TOutput, null> {
  status: 'idle';
  data: undefined;
  error: null;
}

export interface TreatySubscriptionConnectingResult<TOutput, TError>
  extends TreatySubscriptionBaseResult<TOutput, TError> {
  status: 'connecting';
  data: undefined | TOutput;
  error: TError | null;
}

export interface TreatySubscriptionPendingResult<TOutput>
  extends TreatySubscriptionBaseResult<TOutput, undefined> {
  status: 'pending';
  data: TOutput | undefined;
  error: null;
}

export interface TreatySubscriptionErrorResult<TOutput, TError>
  extends TreatySubscriptionBaseResult<TOutput, TError> {
  status: 'error';
  data: TOutput | undefined;
  error: TError;
}

export type TreatySubscriptionResult<TOutput, TError> =
  | TreatySubscriptionIdleResult<TOutput>
  | TreatySubscriptionConnectingResult<TOutput, TError>
  | TreatySubscriptionErrorResult<TOutput, TError>
  | TreatySubscriptionPendingResult<TOutput>;

type AnyTreatySubscriptionOptionsIn =
  | BaseTreatySubscriptionOptionsIn<unknown, unknown>
  | UnusedSkipTokenTreatySubscriptionOptionsIn<unknown, unknown>;

type AnyTreatySubscriptionOptionsOut<TFeatureFlags extends FeatureFlags> =
  TreatySubscriptionOptionsOut<unknown, unknown, TFeatureFlags>;

type EdenWsLike = {
  on: (type: string, listener: (event: any) => void, options?: any) => unknown;
  subscribe: (onMessage: (event: any) => void, options?: any) => unknown;
  close: () => unknown;
};

function callTreatySubscribe(args: {
  client: unknown;
  path: string[];
  params: Array<Record<string, unknown>>;
  input: unknown;
}): EdenWsLike {
  const method = args.path[args.path.length - 1];
  if (!method) {
    throw new Error('treaty-tanstack-react-query: empty procedure path');
  }

  const segments = args.path.slice(0, -1);
  let current: any = args.client;
  let paramIndex = 0;

  for (const segment of segments) {
    if (segment.startsWith(':')) {
      const param = args.params[paramIndex++];
      if (!param) {
        throw new Error(
          `treaty-tanstack-react-query: missing param for segment "${segment}"`,
        );
      }
      current = current(param);
      continue;
    }
    current = current?.[segment];
  }

  const methodFn = current?.[method];
  if (typeof methodFn !== 'function') {
    throw new Error(
      `treaty-tanstack-react-query: could not resolve client method for "${args.path.join(
        '.',
      )}"`,
    );
  }

  const ws = methodFn(args.input) as EdenWsLike;
  return ws;
}

/**
 * @internal
 */
export const treatySubscriptionOptions = <
  TFeatureFlags extends FeatureFlags,
>(args: {
  client: unknown;
  params: Array<Record<string, unknown>>;
  path: string[];
  queryKey: TreatyQueryKey<TFeatureFlags['keyPrefix']>;
  input: unknown;
  opts?: AnyTreatySubscriptionOptionsIn;
}): AnyTreatySubscriptionOptionsOut<TFeatureFlags> => {
  const { path, queryKey, opts = {} } = args;

  const enabled =
    'enabled' in opts ? !!(opts as any).enabled : args.input !== skipToken;

  const _subscribe: ReturnType<
    TreatySubscriptionOptions<any, TFeatureFlags>
  >['subscribe'] = (innerOpts) => {
    if (!enabled) {
      return { unsubscribe() {} };
    }

    let active = true;
    const ws = callTreatySubscribe({
      client: args.client,
      path,
      params: args.params,
      input: args.input === skipToken ? undefined : args.input,
    });

    innerOpts.onConnectionStateChange?.({ state: 'connecting', error: null });

    ws.on('open', () => {
      if (!active) return;
      innerOpts.onStarted?.();
      innerOpts.onConnectionStateChange?.({ state: 'pending', error: null });
    });

    ws.subscribe((event) => {
      if (!active) return;
      innerOpts.onData?.(event?.data);
    });

    ws.on('error', (event) => {
      if (!active) return;
      innerOpts.onError?.(event);
      innerOpts.onConnectionStateChange?.({ state: 'connecting', error: event });
    });

    ws.on('close', () => {
      if (!active) return;
      innerOpts.onConnectionStateChange?.({ state: 'idle', error: null });
    });

    return {
      unsubscribe() {
        active = false;
        try {
          ws.close();
        } catch {
          // ignore
        }
      },
    };
  };

  return {
    ...opts,
    enabled,
    subscribe: _subscribe,
    queryKey,
    treaty: createTreatyOptionsResult({ path: path.slice(0, -1) }),
  };
};

export function useSubscription<TOutput, TError>(
  opts: TreatySubscriptionOptionsOut<TOutput, TError, any>,
): TreatySubscriptionResult<TOutput, TError> {
  type $Result = TreatySubscriptionResult<TOutput, TError>;

  const optsRef = React.useRef(opts);
  optsRef.current = opts;

  const trackedProps = React.useRef(new Set<keyof $Result>([]));

  const addTrackedProp = React.useCallback((key: keyof $Result) => {
    trackedProps.current.add(key);
  }, []);

  type Unsubscribe = () => void;
  const currentSubscriptionRef = React.useRef<Unsubscribe>(() => {
    // noop
  });

  const reset = React.useCallback((): void => {
    currentSubscriptionRef.current?.();

    updateState(getInitialState);
    if (!opts.enabled) {
      return;
    }

    const subscription = opts.subscribe({
      onStarted: () => {
        optsRef.current.onStarted?.();
        updateState((prev) => ({
          ...(prev as any),
          status: 'pending',
          error: null,
        }));
      },
      onData: (data) => {
        optsRef.current.onData?.(data);
        updateState((prev) => ({
          ...(prev as any),
          status: 'pending',
          data,
          error: null,
        }));
      },
      onError: (error) => {
        optsRef.current.onError?.(error);
        updateState((prev) => ({
          ...(prev as any),
          status: 'error',
          error,
        }));
      },
      onConnectionStateChange: (result) => {
        optsRef.current.onConnectionStateChange?.(result);
        updateState((prev) => {
          switch (result.state) {
            case 'connecting':
              return {
                ...prev,
                status: 'connecting',
                error: result.error,
              };
            case 'pending':
              return prev;
            case 'idle':
              return {
                ...prev,
                status: 'idle',
                data: undefined,
                error: null,
              };
          }
        });
      },
    });

    currentSubscriptionRef.current = () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashKey(opts.queryKey), opts.enabled]);

  const getInitialState = React.useCallback((): $Result => {
    return opts.enabled
      ? {
          data: undefined,
          error: null,
          status: 'connecting',
          reset,
        }
      : {
          data: undefined,
          error: null,
          status: 'idle',
          reset,
        };
  }, [opts.enabled, reset]);

  const resultRef = React.useRef<$Result>(getInitialState());

  const [state, setState] = React.useState<$Result>(
    trackResult(resultRef, addTrackedProp),
  );

  state.reset = reset;

  const updateState = React.useCallback(
    (callback: (prevState: $Result) => $Result) => {
      const prev = resultRef.current;
      const next = (resultRef.current = callback(prev));

      let shouldUpdate = false;
      for (const key of trackedProps.current) {
        if (prev[key] !== next[key]) {
          shouldUpdate = true;
          break;
        }
      }
      if (shouldUpdate) {
        setState(trackResult(resultRef, addTrackedProp));
      }
    },
    [addTrackedProp],
  );

  React.useEffect(() => {
    if (!opts.enabled) {
      return;
    }
    reset();

    return () => {
      currentSubscriptionRef.current?.();
    };
  }, [reset, opts.enabled]);

  return state;
}

function trackResult<T extends object>(
  result: React.RefObject<T>,
  onTrackResult: (key: keyof T) => void,
): T {
  const trackedResult = new Proxy(result.current, {
    get(_target, prop) {
      onTrackResult(prop as keyof T);
      return result.current[prop as keyof T];
    },
  });

  return trackedResult;
}
