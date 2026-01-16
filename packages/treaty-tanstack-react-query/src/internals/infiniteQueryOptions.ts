import type {
  DataTag,
  InfiniteData,
  DefinedInitialDataInfiniteOptions,
  QueryClient,
  QueryFunction,
  SkipToken,
  UndefinedInitialDataInfiniteOptions,
  UnusedSkipTokenInfiniteOptions,
} from '@tanstack/react-query';
import { infiniteQueryOptions, skipToken } from '@tanstack/react-query';
import type {
  DefaultFeatureFlags,
  ExtractCursorType,
  FeatureFlags,
  ResolverDef,
  TreatyInfiniteData,
  TreatyQueryBaseOptions,
  TreatyQueryKey,
  TreatyQueryOptionsResult,
} from './types';
import type { DistributiveOmit } from './types-utils';
import { createTreatyOptionsResult } from './utils';

type ReservedOptions =
  | 'queryKey'
  | 'queryFn'
  | 'queryHashFn'
  | 'queryHash'
  | 'initialPageParam';

interface UndefinedTreatyInfiniteQueryOptionsIn<
  TInput,
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      UnusedSkipTokenInfiniteOptions<
        TQueryFnData,
        TError,
        TreatyInfiniteData<TInput, TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>,
        NonNullable<ExtractCursorType<TInput>> | null
      >,
      ReservedOptions
    >,
    TreatyQueryBaseOptions {
  initialCursor?: NonNullable<ExtractCursorType<TInput>> | null;
}

interface UndefinedTreatyInfiniteQueryOptionsOut<
  TInput,
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      UndefinedInitialDataInfiniteOptions<
        TQueryFnData,
        TError,
        TreatyInfiniteData<TInput, TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>,
        NonNullable<ExtractCursorType<TInput>> | null
      >,
      'initialPageParam'
    >,
    TreatyQueryOptionsResult {
  queryKey: DataTag<
    TreatyQueryKey<TFeatureFlags['keyPrefix']>,
    InfiniteData<TQueryFnData>,
    TError
  >;
  initialPageParam: NonNullable<ExtractCursorType<TInput>> | null;
}

interface DefinedTreatyInfiniteQueryOptionsIn<
  TInput,
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      DefinedInitialDataInfiniteOptions<
        TQueryFnData,
        TError,
        TreatyInfiniteData<TInput, TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>,
        NonNullable<ExtractCursorType<TInput>> | null
      >,
      ReservedOptions
    >,
    TreatyQueryBaseOptions {
  initialCursor?: NonNullable<ExtractCursorType<TInput>> | null;
}

interface DefinedTreatyInfiniteQueryOptionsOut<
  TInput,
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      DefinedInitialDataInfiniteOptions<
        TQueryFnData,
        TError,
        TreatyInfiniteData<TInput, TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>,
        NonNullable<ExtractCursorType<TInput>> | null
      >,
      'initialPageParam'
    >,
    TreatyQueryOptionsResult {
  queryKey: DataTag<
    TreatyQueryKey<TFeatureFlags['keyPrefix']>,
    InfiniteData<TQueryFnData>,
    TError
  >;
  initialPageParam: NonNullable<ExtractCursorType<TInput>> | null;
}

interface UnusedSkipTokenTreatyInfiniteQueryOptionsIn<
  TInput,
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      UnusedSkipTokenInfiniteOptions<
        TQueryFnData,
        TError,
        TreatyInfiniteData<TInput, TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>,
        NonNullable<ExtractCursorType<TInput>> | null
      >,
      ReservedOptions
    >,
    TreatyQueryBaseOptions {
  initialCursor?: NonNullable<ExtractCursorType<TInput>> | null;
}

interface UnusedSkipTokenTreatyInfiniteQueryOptionsOut<
  TInput,
  TQueryFnData,
  TData,
  TError,
  TFeatureFlags extends FeatureFlags,
> extends DistributiveOmit<
      UnusedSkipTokenInfiniteOptions<
        TQueryFnData,
        TError,
        TreatyInfiniteData<TInput, TData>,
        TreatyQueryKey<TFeatureFlags['keyPrefix']>,
        NonNullable<ExtractCursorType<TInput>> | null
      >,
      'initialPageParam'
    >,
    TreatyQueryOptionsResult {
  queryKey: DataTag<
    TreatyQueryKey<TFeatureFlags['keyPrefix']>,
    InfiniteData<TQueryFnData>,
    TError
  >;
  initialPageParam: NonNullable<ExtractCursorType<TInput>> | null;
}

export interface TreatyInfiniteQueryOptions<
  TDef extends ResolverDef,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> {
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(
    ...args: undefined extends TDef['input']
      ? [
          input: TDef['input'] | SkipToken,
          opts: DefinedTreatyInfiniteQueryOptionsIn<
            TDef['input'],
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
      : [
          input: TDef['input'] | SkipToken,
          opts: DefinedTreatyInfiniteQueryOptionsIn<
            TDef['input'],
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
  ): DefinedTreatyInfiniteQueryOptionsOut<
    TDef['input'],
    TQueryFnData,
    TData,
    TDef['error'],
    TFeatureFlags
  >;

  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(
    ...args: undefined extends TDef['input']
      ? [
          input: TDef['input'],
          opts: UnusedSkipTokenTreatyInfiniteQueryOptionsIn<
            TDef['input'],
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
      : [
          input: TDef['input'],
          opts: UnusedSkipTokenTreatyInfiniteQueryOptionsIn<
            TDef['input'],
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
  ): UnusedSkipTokenTreatyInfiniteQueryOptionsOut<
    TDef['input'],
    TQueryFnData,
    TData,
    TDef['error'],
    TFeatureFlags
  >;

  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(
    ...args: undefined extends TDef['input']
      ? [
          input?: TDef['input'] | SkipToken,
          opts?: UndefinedTreatyInfiniteQueryOptionsIn<
            TDef['input'],
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
      : [
          input: TDef['input'] | SkipToken,
          opts?: UndefinedTreatyInfiniteQueryOptionsIn<
            TDef['input'],
            TQueryFnData,
            TData,
            TDef['error'],
            TFeatureFlags
          >,
        ]
  ): UndefinedTreatyInfiniteQueryOptionsOut<
    TDef['input'],
    TQueryFnData,
    TData,
    TDef['error'],
    TFeatureFlags
  >;

  /**
   * @internal prefer using inferInput and inferOutput to access types
   */
  '~types': {
    input: TDef['input'];
    output: TDef['output'];
    error: TDef['error'];
  };
}

type AnyTreatyInfiniteQueryOptionsIn<TFeatureFlags extends FeatureFlags> =
  | DefinedTreatyInfiniteQueryOptionsIn<any, any, any, any, TFeatureFlags>
  | UnusedSkipTokenTreatyInfiniteQueryOptionsIn<any, any, any, any, TFeatureFlags>
  | UndefinedTreatyInfiniteQueryOptionsIn<any, any, any, any, TFeatureFlags>;

type AnyTreatyInfiniteQueryOptionsOut<TFeatureFlags extends FeatureFlags> =
  | DefinedTreatyInfiniteQueryOptionsOut<any, any, any, any, TFeatureFlags>
  | UnusedSkipTokenTreatyInfiniteQueryOptionsOut<any, any, any, any, TFeatureFlags>
  | UndefinedTreatyInfiniteQueryOptionsOut<any, any, any, any, TFeatureFlags>;

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

function stripCursorAndDirection(input: unknown): unknown {
  if (!isObject(input)) {
    return input;
  }

  const { cursor: _cursor, direction: _direction, ...rest } = input as any;
  const next: Record<string, unknown> = { ...rest };

  if (isObject(next.query)) {
    const {
      cursor: _queryCursor,
      direction: _queryDirection,
      ...queryRest
    } = next.query as any;
    next.query = queryRest;
  }

  return next;
}

function getCursorFromInput(input: unknown): unknown {
  if (!isObject(input)) {
    return undefined;
  }
  if ('cursor' in input) {
    return (input as any).cursor;
  }
  if (isObject((input as any).query) && 'cursor' in (input as any).query) {
    return (input as any).query.cursor;
  }
  return undefined;
}

function addCursorToInput(args: {
  input: unknown;
  cursor: unknown;
  direction: 'forward' | 'backward';
}): unknown {
  const base = args.input;
  const shouldAddDirection =
    isObject(base) &&
    ('direction' in base ||
      (isObject((base as any).query) && 'direction' in (base as any).query));

  const next = (isObject(base) ? { ...(base as any) } : {}) as Record<
    string,
    unknown
  >;

  const hadQuery = isObject(base) && 'query' in base;
  const nextQuery = (isObject(next.query) ? { ...(next.query as any) } : {}) as Record<
    string,
    unknown
  >;

  if (args.cursor === null || typeof args.cursor === 'undefined') {
    delete nextQuery.cursor;
  } else {
    nextQuery.cursor = args.cursor;
  }

  if (shouldAddDirection) {
    nextQuery.direction = args.direction;
  }

  if (Object.keys(nextQuery).length > 0 || hadQuery) {
    next.query = nextQuery;
  }

  return next;
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
    args.abortOnUnmount && isObject(args.input)
      ? mergeSignalIntoFetch(args.input as Record<string, unknown>, args.signal)
      : args.abortOnUnmount && typeof args.input === 'undefined'
        ? mergeSignalIntoFetch(undefined, args.signal)
        : args.input;

  return (await methodFn(input)) as CallTreatyResult;
}

export function treatyInfiniteQueryOptions<
  TFeatureFlags extends FeatureFlags,
>(args: {
  client: unknown;
  params: Array<Record<string, unknown>>;
  input: unknown;
  opts: AnyTreatyInfiniteQueryOptionsIn<TFeatureFlags> | undefined;
  path: string[];
  methodExplicit: boolean;
  queryClient: QueryClient | (() => QueryClient);
  queryKey: TreatyQueryKey<TFeatureFlags['keyPrefix']>;
}): AnyTreatyInfiniteQueryOptionsOut<TFeatureFlags> {
  const { input, path, queryKey, opts } = args;

  const inputIsSkipToken = input === skipToken;
  const baseInput = stripCursorAndDirection(inputIsSkipToken ? undefined : input);

  const queryFn: QueryFunction<
    unknown,
    TreatyQueryKey<TFeatureFlags['keyPrefix']>,
    unknown
  > = async (queryFnContext) => {
    const abortOnUnmount = !!opts?.treaty?.abortOnUnmount;

    const requestInput = addCursorToInput({
      input: baseInput,
      cursor: queryFnContext.pageParam,
      direction: queryFnContext.direction,
    });

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
        input: requestInput,
        signal: queryFnContext.signal,
        abortOnUnmount,
      });

      if (result.error) throw result.error;
      return result.data;
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
          input: requestInput,
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
        return result.data;
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

  const initialPageParam =
    (opts as any)?.initialCursor ?? getCursorFromInput(input) ?? null;

  return Object.assign(
    infiniteQueryOptions({
      ...(opts ?? ({} as AnyTreatyInfiniteQueryOptionsIn<TFeatureFlags>)),
      queryKey,
      queryFn: inputIsSkipToken ? skipToken : queryFn,
      initialPageParam,
    }),
    { treaty: createTreatyOptionsResult({ path: path.slice(0, -1) }) },
  );
}
