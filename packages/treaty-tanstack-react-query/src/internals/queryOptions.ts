import type {
  DataTag,
  DefinedInitialDataOptions,
  QueryClient,
  QueryFunction,
  SkipToken,
  UndefinedInitialDataOptions,
  UnusedSkipTokenOptions,
} from '@tanstack/react-query';
import { queryOptions, skipToken } from '@tanstack/react-query';
import type {
  DefaultFeatureFlags,
  FeatureFlags,
  ResolverDef,
  TreatyQueryBaseOptions,
  TreatyQueryKey,
  TreatyQueryOptionsResult,
} from './types';
import type { coerceAsyncIterableToArray, DistributiveOmit } from './types-utils';
import {
  buildQueryFromAsyncIterable,
  createTreatyOptionsResult,
  isAsyncIterable,
  unwrapLazyArg,
} from './utils';

type ReservedOptions = 'queryKey' | 'queryFn' | 'queryHashFn' | 'queryHash';

interface UndefinedTreatyQueryOptionsIn<
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      UndefinedInitialDataOptions<
        coerceAsyncIterableToArray<TQueryFnData>,
        TError,
        coerceAsyncIterableToArray<TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>
      >,
      ReservedOptions
    >,
    TreatyQueryBaseOptions {}

interface UndefinedTreatyQueryOptionsOut<
  TQueryFnData,
  TOutput,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends UndefinedInitialDataOptions<
      coerceAsyncIterableToArray<TQueryFnData>,
      TError,
      coerceAsyncIterableToArray<TOutput>,
      TreatyQueryKey<TFeatureFlags['keyPrefix']>
    >,
    TreatyQueryOptionsResult {
  queryKey: DataTag<
    TreatyQueryKey<TFeatureFlags['keyPrefix']>,
    coerceAsyncIterableToArray<TOutput>,
    TError
  >;
}

interface DefinedTreatyQueryOptionsIn<
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      DefinedInitialDataOptions<
        coerceAsyncIterableToArray<NoInfer<TQueryFnData>>,
        TError,
        coerceAsyncIterableToArray<TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>
      >,
      ReservedOptions
    >,
    TreatyQueryBaseOptions {}

interface DefinedTreatyQueryOptionsOut<
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DefinedInitialDataOptions<
      coerceAsyncIterableToArray<TQueryFnData>,
      TError,
      coerceAsyncIterableToArray<TData>,
      TreatyQueryKey<TFeatureFlags['keyPrefix']>
    >,
    TreatyQueryOptionsResult {
  queryKey: DataTag<
    TreatyQueryKey<TFeatureFlags['keyPrefix']>,
    coerceAsyncIterableToArray<TData>,
    TError
  >;
}

interface UnusedSkipTokenTreatyQueryOptionsIn<
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      UnusedSkipTokenOptions<
        coerceAsyncIterableToArray<TQueryFnData>,
        TError,
        coerceAsyncIterableToArray<TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>
      >,
      ReservedOptions
    >,
    TreatyQueryBaseOptions {}

interface UnusedSkipTokenTreatyQueryOptionsOut<
  TQueryFnData,
  TOutput,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends UnusedSkipTokenOptions<
      coerceAsyncIterableToArray<TQueryFnData>,
      TError,
      coerceAsyncIterableToArray<TOutput>,
      TreatyQueryKey<TFeatureFlags['keyPrefix']>
    >,
    TreatyQueryOptionsResult {
  queryKey: DataTag<
    TreatyQueryKey<TFeatureFlags['keyPrefix']>,
    coerceAsyncIterableToArray<TOutput>,
    TError
  >;
}

export interface TreatyQueryOptions<
  TDef extends ResolverDef,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> {
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(
    ...args: undefined extends TDef['input']
      ? [
          input: TDef['input'] | SkipToken,
          opts: DefinedTreatyQueryOptionsIn<
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
      : [
          input: TDef['input'] | SkipToken,
          opts: DefinedTreatyQueryOptionsIn<
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
  ): DefinedTreatyQueryOptionsOut<TQueryFnData, TData, TDef['error'], TFeatureFlags>;

  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(
    ...args: undefined extends TDef['input']
      ? [
          input?: TDef['input'],
          opts?: UnusedSkipTokenTreatyQueryOptionsIn<
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
      : [
          input: TDef['input'],
          opts?: UnusedSkipTokenTreatyQueryOptionsIn<
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
  ): UnusedSkipTokenTreatyQueryOptionsOut<
    TQueryFnData,
    TData,
    TDef['error'],
    TFeatureFlags
  >;

  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(
    ...args: undefined extends TDef['input']
      ? [
          input?: TDef['input'] | SkipToken,
          opts?: UndefinedTreatyQueryOptionsIn<
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
      : [
          input: TDef['input'] | SkipToken,
          opts?: UndefinedTreatyQueryOptionsIn<
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
  ): UndefinedTreatyQueryOptionsOut<TQueryFnData, TData, TDef['error'], TFeatureFlags>;

  /**
   * @internal prefer using inferInput and inferOutput to access types
   */
  '~types': {
    input: TDef['input'];
    output: TDef['output'];
    error: TDef['error'];
  };
}

type AnyTreatyQueryOptionsIn<TFeatureFlags extends FeatureFlags> =
  | DefinedTreatyQueryOptionsIn<unknown, unknown, unknown, TFeatureFlags>
  | UnusedSkipTokenTreatyQueryOptionsIn<unknown, unknown, unknown, TFeatureFlags>
  | UndefinedTreatyQueryOptionsIn<unknown, unknown, unknown, TFeatureFlags>;

type AnyTreatyQueryOptionsOut<TFeatureFlags extends FeatureFlags> =
  | DefinedTreatyQueryOptionsOut<unknown, unknown, unknown, TFeatureFlags>
  | UnusedSkipTokenTreatyQueryOptionsOut<unknown, unknown, unknown, TFeatureFlags>
  | UndefinedTreatyQueryOptionsOut<unknown, unknown, unknown, TFeatureFlags>;

type CallTreatyResult = {
  data: unknown;
  error: unknown;
};

const AUTO_QUERY_METHOD_ORDER = ['get', 'head'] as const;

type AutoQueryMethod = (typeof AUTO_QUERY_METHOD_ORDER)[number];

const autoQueryMethodCache = new WeakMap<object, Map<string, AutoQueryMethod>>();

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}

function shouldTryNextMethod(error: unknown): boolean {
  if (
    error instanceof Error &&
    error.message.includes(
      'treaty-tanstack-react-query: could not resolve client method',
    )
  ) {
    return true;
  }

  const status = getErrorStatus(error);
  return status === 405;
}

function mergeSignalIntoFetch(
  options: Record<string, unknown> | undefined,
  signal: AbortSignal,
) {
  const fetch = (options?.fetch as Record<string, unknown> | undefined) ?? {};
  return {
    ...(options ?? {}),
    fetch: {
      ...fetch,
      signal,
    },
  };
}

async function callTreatyGetLike(args: {
  client: unknown;
  path: string[];
  params: Array<Record<string, unknown>>;
  input: unknown;
  signal: AbortSignal;
  abortOnUnmount: boolean;
}): Promise<CallTreatyResult> {
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

  const input =
    args.abortOnUnmount && typeof args.input === 'object' && args.input !== null
      ? mergeSignalIntoFetch(args.input as Record<string, unknown>, args.signal)
      : args.abortOnUnmount && typeof args.input === 'undefined'
        ? mergeSignalIntoFetch(undefined, args.signal)
        : args.input;

  const result = (await methodFn(input)) as CallTreatyResult;
  return result;
}

export function treatyQueryOptions<TFeatureFlags extends FeatureFlags>(args: {
  client: unknown;
  params: Array<Record<string, unknown>>;
  input: unknown;
  opts: AnyTreatyQueryOptionsIn<TFeatureFlags> | undefined;
  path: string[];
  methodExplicit: boolean;
  queryClient: QueryClient | (() => QueryClient);
  queryKey: TreatyQueryKey<TFeatureFlags['keyPrefix']>;
}): AnyTreatyQueryOptionsOut<TFeatureFlags> {
  const { input, path, queryKey, opts } = args;
  const queryClient = unwrapLazyArg(args.queryClient);

  const inputIsSkipToken = input === skipToken;

  const queryFn: QueryFunction<
    unknown,
    TreatyQueryKey<TFeatureFlags['keyPrefix']>
  > = async (queryFnContext) => {
    const actualOpts = opts ?? {};
    const abortOnUnmount = !!actualOpts.treaty?.abortOnUnmount;

    if (path.length === 0) {
      throw new Error('treaty-tanstack-react-query: empty procedure path');
    }

    const routePath = path.slice(0, -1);
    const requestedMethod = path[path.length - 1] as string;

    if (args.methodExplicit) {
      const result = await callTreatyGetLike({
        client: args.client,
        path,
        params: args.params,
        input,
        signal: queryFnContext.signal,
        abortOnUnmount,
      });

      if (result.error) throw result.error;

      const data = result.data;
      if (isAsyncIterable(data)) {
        return buildQueryFromAsyncIterable(data, queryClient, queryKey);
      }
      return data;
    }

    const cacheOwner =
      (typeof args.client === 'object' && args.client !== null
        ? args.client
        : typeof args.client === 'function'
          ? args.client
          : null) as object | null;
    const cacheKey = routePath.join('.');

    const methodCache =
      cacheOwner !== null
        ? (autoQueryMethodCache.get(cacheOwner) ??
          (autoQueryMethodCache.set(cacheOwner, new Map()),
          autoQueryMethodCache.get(cacheOwner)!))
        : null;

    const cachedMethod = methodCache?.get(cacheKey);
    const order = AUTO_QUERY_METHOD_ORDER;

    const candidates = cachedMethod
      ? ([cachedMethod, ...order.filter((m) => m !== cachedMethod)] as AutoQueryMethod[])
      : order.includes(requestedMethod as AutoQueryMethod)
        ? ([
            requestedMethod as AutoQueryMethod,
            ...order.filter((m) => m !== (requestedMethod as AutoQueryMethod)),
          ] as AutoQueryMethod[])
        : [...order];

    let lastError: unknown = undefined;

    for (const method of candidates) {
      try {
        const result = await callTreatyGetLike({
          client: args.client,
          path: [...routePath, method],
          params: args.params,
          input,
          signal: queryFnContext.signal,
          abortOnUnmount,
        });

        if (result.error) {
          lastError = result.error;
          if (shouldTryNextMethod(result.error)) {
            continue;
          }
          throw result.error;
        }

        methodCache?.set(cacheKey, method);

        const data = result.data;
        if (isAsyncIterable(data)) {
          return buildQueryFromAsyncIterable(data, queryClient, queryKey);
        }
        return data;
      } catch (error) {
        lastError = error;
        if (shouldTryNextMethod(error)) {
          continue;
        }
        throw error;
      }
    }

    throw (
      lastError ??
      new Error(
        `treaty-tanstack-react-query: could not resolve a query method for ${cacheKey || '<root>'}`,
      )
    );
  };

  return Object.assign(
    queryOptions({
      ...opts,
      queryKey,
      queryFn: inputIsSkipToken ? skipToken : queryFn,
    }),
    { treaty: createTreatyOptionsResult({ path: path.slice(0, -1) }) },
  );
}
