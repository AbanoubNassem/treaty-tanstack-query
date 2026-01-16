import type { Treaty } from '@elysiajs/eden/treaty2';
import {
  skipToken,
  type DataTag,
  type QueryClient,
  type QueryFilters,
} from '@tanstack/react-query';
import {
  treatyInfiniteQueryOptions,
  type TreatyInfiniteQueryOptions,
} from './infiniteQueryOptions';
import type { MutationOptionsOverride } from './mutationOptions';
import {
  treatyMutationOptions,
  type TreatyMutationOptions,
  type TreatyMutationOptionsIn,
  type TreatyMutationOptionsOut,
} from './mutationOptions';
import { treatyQueryOptions, type TreatyQueryOptions } from './queryOptions';
import {
  treatySubscriptionOptions,
  type TreatySubscriptionOptions,
} from './subscriptionOptions';
import type {
  DefaultFeatureFlags,
  FeatureFlags,
  KeyPrefixOptions,
  ResolverDef,
  TreatyInfiniteData,
  TreatyMutationKey,
  TreatyQueryKey,
  WithRequired,
} from './types';
import {
  getMutationKeyInternal,
  getQueryKeyInternal,
  unwrapLazyArg,
} from './utils';

export interface DecorateRouterKeyable<TFeatureFlags extends FeatureFlags> {
  pathKey: () => TreatyQueryKey<TFeatureFlags['keyPrefix']>;
  pathFilter: (
    filters?: QueryFilters<TreatyQueryKey<TFeatureFlags['keyPrefix']>>,
  ) => WithRequired<
    QueryFilters<TreatyQueryKey<TFeatureFlags['keyPrefix']>>,
    'queryKey'
  >;
}

interface TypeHelper<TDef extends ResolverDef> {
  /**
   * @internal prefer using inferInput and inferOutput to access types
   */
  '~types': {
    input: TDef['input'];
    output: TDef['output'];
    error: TDef['error'];
  };
}

type AnyTypeHelper = {
  '~types': {
    input: unknown;
    output: unknown;
    error: unknown;
  };
};

export type inferInput<
  TProcedure extends AnyTypeHelper,
> = TProcedure['~types']['input'];

export type inferOutput<
  TProcedure extends AnyTypeHelper,
> = TProcedure['~types']['output'];

export interface DecorateInfiniteQueryProcedure<TDef extends ResolverDef>
  extends TypeHelper<TDef> {
  infiniteQueryOptions: TreatyInfiniteQueryOptions<TDef, TDef['featureFlags']>;
  infiniteQueryKey: (input?: Partial<TDef['input']>) => DataTag<
    TreatyQueryKey<TDef['featureFlags']['keyPrefix']>,
    TreatyInfiniteData<TDef['input'], TDef['output']>,
    TDef['error']
  >;
  infiniteQueryFilter: (
    input?: Partial<TDef['input']>,
    filters?: QueryFilters<
      DataTag<
        TreatyQueryKey<TDef['featureFlags']['keyPrefix']>,
        TreatyInfiniteData<TDef['input'], TDef['output']>,
        TDef['error']
      >
    >,
  ) => WithRequired<
    QueryFilters<
      DataTag<
        TreatyQueryKey<TDef['featureFlags']['keyPrefix']>,
        TreatyInfiniteData<TDef['input'], TDef['output']>,
        TDef['error']
      >
    >,
    'queryKey'
  >;
}

export interface DecorateQueryProcedure<TDef extends ResolverDef>
  extends TypeHelper<TDef> {
  queryOptions: TreatyQueryOptions<TDef, TDef['featureFlags']>;
  queryKey: (input?: Partial<TDef['input']>) => DataTag<
    TreatyQueryKey<TDef['featureFlags']['keyPrefix']>,
    TDef['output'],
    TDef['error']
  >;
  queryFilter: (
    input?: Partial<TDef['input']>,
    filters?: QueryFilters<
      DataTag<
        TreatyQueryKey<TDef['featureFlags']['keyPrefix']>,
        TDef['output'],
        TDef['error']
      >
    >,
  ) => WithRequired<
    QueryFilters<
      DataTag<
        TreatyQueryKey<TDef['featureFlags']['keyPrefix']>,
        TDef['output'],
        TDef['error']
      >
    >,
    'queryKey'
  >;
}

export interface DecorateMutationProcedure<TDef extends ResolverDef>
  extends TypeHelper<TDef> {
  mutationOptions: TreatyMutationOptions<TDef, TDef['featureFlags']>;
  mutationKey: () => TreatyMutationKey<TDef['featureFlags']['keyPrefix']>;
}

export interface DecorateSubscriptionProcedure<TDef extends ResolverDef>
  extends TypeHelper<TDef> {
  subscriptionOptions: TreatySubscriptionOptions<TDef, TDef['featureFlags']>;
}

type NonUndefined<T> = Exclude<T, undefined>;

type HasKnownProperty<TObj, TKey extends PropertyKey> = TKey extends keyof TObj
  ? string extends keyof TObj
    ? false
    : number extends keyof TObj
      ? false
      : symbol extends keyof TObj
        ? false
        : true
  : false;

type HasCursorInput<TInput> = [NonUndefined<TInput>] extends [object]
  ? HasKnownProperty<NonUndefined<TInput>, 'cursor'> extends true
    ? true
    : NonUndefined<TInput> extends { query?: infer TQuery }
      ? [Exclude<TQuery, undefined>] extends [object]
        ? HasKnownProperty<Exclude<TQuery, undefined>, 'cursor'> extends true
          ? true
          : false
        : false
      : false
  : false;

export type DecorateProcedure<
  TMethod extends string,
  TDef extends ResolverDef,
> = TMethod extends 'get' | 'head'
  ? DecorateQueryProcedure<TDef> &
      (HasCursorInput<TDef['input']> extends true
        ? DecorateInfiniteQueryProcedure<TDef>
        : Record<never, never>)
  : TMethod extends
        | 'post'
        | 'put'
        | 'delete'
        | 'patch'
        | 'options'
        | 'connect'
    ? DecorateMutationProcedure<TDef>
    : TMethod extends 'subscribe'
      ? DecorateSubscriptionProcedure<TDef>
    : never;

type HttpQueryMethod = 'get' | 'head';
type HttpMutationMethod =
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'connect';
type HttpSubscriptionMethod = 'subscribe';
type HttpMethod = HttpQueryMethod | HttpMutationMethod | HttpSubscriptionMethod;

type FirstArg<TFn> = TFn extends (...args: any[]) => any ? Parameters<TFn>[0] : undefined;

type MaybePromise<T> = T | Promise<T>;
type MaybeFunction<T> = T | ((...args: any[]) => T);
type TreatyDataConstraint = MaybeFunction<MaybePromise<Treaty.TreatyResponse<{}>>>;

type TreatyOutput<TMethodFn> = TMethodFn extends TreatyDataConstraint
  ? Treaty.Data<TMethodFn>
  : never;
type TreatyError<TMethodFn> = TMethodFn extends TreatyDataConstraint
  ? Treaty.Error<TMethodFn>
  : never;

type TreatySubscriptionOutput<TMethodFn> = TMethodFn extends (
  ...args: any[]
) => infer TReturn
  ? TReturn extends {
      subscribe: (onMessage: (event: infer TEvent) => any, ...args: any[]) => any;
    }
    ? TEvent extends { data: infer TData }
      ? TData
      : never
    : never
  : never;

type WithoutTypes<TObj> = Omit<TObj, '~types'>;

type MethodIfCallable<TClient, TMethod extends string> = TMethod extends keyof TClient
  ? TClient[TMethod] extends (...args: any[]) => any
    ? Extract<keyof TClient, TMethod>
    : never
  : never;

type DefaultQueryMethod<TClient> = MethodIfCallable<TClient, 'get'> extends never
  ? MethodIfCallable<TClient, 'head'> extends never
    ? never
    : 'head'
  : 'get';

type DefaultMutationMethod<TClient> = MethodIfCallable<TClient, 'post'> extends never
  ? MethodIfCallable<TClient, 'put'> extends never
    ? MethodIfCallable<TClient, 'patch'> extends never
      ? MethodIfCallable<TClient, 'delete'> extends never
        ? MethodIfCallable<TClient, 'options'> extends never
          ? MethodIfCallable<TClient, 'connect'> extends never
            ? never
            : 'connect'
          : 'options'
        : 'delete'
      : 'patch'
    : 'put'
  : 'post';

type DefaultSubscriptionMethod<TClient> = MethodIfCallable<
  TClient,
  'subscribe'
>;

type QueryMethodsOf<TClient> = {
  [TMethod in HttpQueryMethod]: MethodIfCallable<TClient, TMethod>;
}[HttpQueryMethod];

type MutationMethodsOf<TClient> = {
  [TMethod in HttpMutationMethod]: MethodIfCallable<TClient, TMethod>;
}[HttpMutationMethod];

type SubscriptionMethodsOf<TClient> = {
  [TMethod in HttpSubscriptionMethod]: MethodIfCallable<TClient, TMethod>;
}[HttpSubscriptionMethod];

type DefaultQueryResolverDef<
  TClient,
  TMethod extends keyof TClient & HttpQueryMethod,
  TFeatureFlags extends FeatureFlags,
> = {
  input: FirstArg<TClient[TMethod]>;
  output: TreatyOutput<TClient[TMethod]>;
  error: TreatyError<TClient[TMethod]>;
  featureFlags: TFeatureFlags;
};

type DefaultMutationResolverDef<
  TClient,
  TMethod extends keyof TClient & HttpMutationMethod,
  TFeatureFlags extends FeatureFlags,
> = {
  input: FirstArg<TClient[TMethod]>;
  output: TreatyOutput<TClient[TMethod]>;
  error: TreatyError<TClient[TMethod]>;
  featureFlags: TFeatureFlags;
};

type DefaultSubscriptionResolverDef<
  TClient,
  TMethod extends keyof TClient & HttpSubscriptionMethod,
  TFeatureFlags extends FeatureFlags,
> = {
  input: FirstArg<TClient[TMethod]>;
  output: TreatySubscriptionOutput<TClient[TMethod]>;
  error: unknown;
  featureFlags: TFeatureFlags;
};

type DecorateDefaultQueryProcedure<
  TClient,
  TFeatureFlags extends FeatureFlags,
> = [DefaultQueryMethod<TClient>] extends [never]
  ? Record<never, never>
  : DefaultQueryMethod<TClient> extends infer TMethod extends keyof TClient &
        HttpQueryMethod
    ? WithoutTypes<
        DecorateQueryProcedure<
          DefaultQueryResolverDef<TClient, TMethod, TFeatureFlags>
        >
      > &
        (HasCursorInput<FirstArg<TClient[TMethod]>> extends true
          ? WithoutTypes<
              DecorateInfiniteQueryProcedure<
                DefaultQueryResolverDef<TClient, TMethod, TFeatureFlags>
              >
            >
          : Record<never, never>)
    : Record<never, never>;

type DecorateDefaultMutationProcedure<
  TClient,
  TFeatureFlags extends FeatureFlags,
> = [DefaultMutationMethod<TClient>] extends [never]
  ? Record<never, never>
  : DefaultMutationMethod<TClient> extends infer TMethod extends keyof TClient &
        HttpMutationMethod
    ? {
        mutationOptions: TreatyMutationOptionsDispatcher<TClient, TFeatureFlags>;
        mutationKey: WithoutTypes<
          DecorateMutationProcedure<
            DefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>
          >
        >['mutationKey'];
      }
    : Record<never, never>;

type DecorateDefaultSubscriptionProcedure<
  TClient,
  TFeatureFlags extends FeatureFlags,
> = [DefaultSubscriptionMethod<TClient>] extends [never]
  ? Record<never, never>
  : DefaultSubscriptionMethod<TClient> extends infer TMethod extends keyof TClient &
        HttpSubscriptionMethod
    ? WithoutTypes<
        DecorateSubscriptionProcedure<
          DefaultSubscriptionResolverDef<TClient, TMethod, TFeatureFlags>
        >
      >
    : Record<never, never>;

type DecorateDefaultProcedures<
  TClient,
  TFeatureFlags extends FeatureFlags,
> = DecorateDefaultQueryProcedure<TClient, TFeatureFlags> &
  DecorateDefaultMutationProcedure<TClient, TFeatureFlags> &
  DecorateDefaultSubscriptionProcedure<TClient, TFeatureFlags>;

type AnyDefaultMutationResolverDef<
  TClient,
  TMethod extends MutationMethodsOf<TClient>,
  TFeatureFlags extends FeatureFlags,
> = DefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>;

export interface TreatyMutationOptionsDispatcher<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> extends TypeHelper<
    DefaultMutationMethod<TClient> extends infer TMethod extends MutationMethodsOf<TClient>
      ? AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>
      : never
  > {
  <TContext = unknown>(
    opts?: DefaultMutationMethod<TClient> extends infer TMethod extends MutationMethodsOf<TClient>
      ? TreatyMutationOptionsIn<
          AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['input'],
          AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['error'],
          AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['output'],
          TContext
        >
      : never,
  ): DefaultMutationMethod<TClient> extends infer TMethod extends MutationMethodsOf<TClient>
    ? TreatyMutationOptionsOut<
        AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['input'],
        AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['error'],
        AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['output'],
        TContext,
        TFeatureFlags
      >
    : never;

  <TMethod extends MutationMethodsOf<TClient>, TContext = unknown>(
    method: TMethod,
    opts?: TreatyMutationOptionsIn<
      AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['input'],
      AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['error'],
      AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['output'],
      TContext
    >,
  ): TreatyMutationOptionsOut<
    AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['input'],
    AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['error'],
    AnyDefaultMutationResolverDef<TClient, TMethod, TFeatureFlags>['output'],
    TContext,
    TFeatureFlags
  >;
}

export type DecoratedTreatyRecord<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> = {
  [TKey in keyof TClient as TKey extends HttpMethod ? never : TKey]: TKey extends string
    ? DecorateTreatyClient<TClient[TKey], TFeatureFlags>
    : never;
};

type AnyHttpMethodsOf<TClient> =
  | QueryMethodsOf<TClient>
  | MutationMethodsOf<TClient>
  | SubscriptionMethodsOf<TClient>;

type HasAnyHttpMethod<TClient> = [AnyHttpMethodsOf<TClient>] extends [never]
  ? false
  : true;

type DecorateEndpointExtras<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> = HasAnyHttpMethod<TClient> extends true
  ? DecorateDefaultProcedures<TClient, TFeatureFlags> &
      DecorateRouterKeyable<TFeatureFlags>
  : Record<never, never>;

export type DecorateTreatyClient<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> = TClient extends (...args: infer TArgs) => infer TReturn
  ? ((...args: TArgs) => DecorateTreatyClient<TReturn, TFeatureFlags>) &
      DecoratedTreatyRecord<TClient, TFeatureFlags> &
      DecorateEndpointExtras<TClient, TFeatureFlags>
  : DecoratedTreatyRecord<TClient, TFeatureFlags> &
      DecorateEndpointExtras<TClient, TFeatureFlags>;

type DecoratedTreatyRecordUtils<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> = {
  [TKey in keyof TClient as TKey extends HttpMethod ? never : TKey]: TKey extends string
    ? TreatyUtilsProxy<TClient[TKey], TFeatureFlags>
    : never;
};

export type TreatyUtilsProxy<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> = TClient extends (...args: infer TArgs) => infer TReturn
  ? ((...args: TArgs) => TreatyUtilsProxy<TReturn, TFeatureFlags>) &
      DecoratedTreatyRecordUtils<TClient, TFeatureFlags> &
      DecorateRouterKeyable<TFeatureFlags>
  : DecoratedTreatyRecordUtils<TClient, TFeatureFlags> &
      DecorateRouterKeyable<TFeatureFlags>;

export type TreatyOptionsProxy<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> = DecorateTreatyClient<TClient, TFeatureFlags>;

export type TreatyOptionsProxyOptions<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> = {
  client: TClient;
  queryClient: QueryClient | (() => QueryClient);
  overrides?: {
    mutations?: MutationOptionsOverride;
  };
} & KeyPrefixOptions<TFeatureFlags>;

type OptionsProxyState = {
  path: string[];
  params: Array<Record<string, unknown>>;
};

type UtilsMethods =
  | keyof DecorateRouterKeyable<any>
  | keyof DecorateQueryProcedure<any>
  | keyof DecorateInfiniteQueryProcedure<any>
  | keyof DecorateMutationProcedure<any>
  | keyof DecorateSubscriptionProcedure<any>
  | '~types';

const RESERVED_METHOD_NAMES = new Set<string>([
  'get',
  'head',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'connect',
  'subscribe',
]);

const DEFAULT_QUERY_METHOD_ORDER = ['get', 'head'] as const;
const DEFAULT_MUTATION_METHOD_ORDER = [
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'connect',
] as const;
const DEFAULT_SUBSCRIPTION_METHOD_ORDER = ['subscribe'] as const;

function isSingleKeyObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1
  );
}

function mergeParamInputs(params: OptionsProxyState['params'], input: unknown) {
  if (params.length === 0) return input;

  const mergedParams = Object.assign({}, ...params);

  if (typeof input === 'undefined') return mergedParams;
  if (input === skipToken) return mergedParams;
  if (typeof input !== 'object' || input === null) {
    return {
      ...mergedParams,
      input,
    };
  }
  return {
    ...mergedParams,
    ...(input as Record<string, unknown>),
  };
}

function resolveTreatyNode(args: {
  client: unknown;
  path: string[];
  params: OptionsProxyState['params'];
}) {
  const segments = args.path;
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

  return current;
}

function resolveProcedurePath(args: {
  client: unknown;
  basePath: string[];
  params: OptionsProxyState['params'];
  methodOrder: readonly string[];
  util: string;
  cache?: Map<string, readonly string[]>;
  cacheKey?: string;
}): string[] {
  const cache = args.cache;
  const cacheKey =
    cache && args.cacheKey ? `${args.cacheKey}|${args.basePath.join('.')}` : undefined;
  if (cache && cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) return [...cached];
  }

  const maybeMethod = args.basePath[args.basePath.length - 1];
  if (typeof maybeMethod === 'string' && args.methodOrder.includes(maybeMethod)) {
    const parent = resolveTreatyNode({
      client: args.client,
      path: args.basePath.slice(0, -1),
      params: args.params,
    });

    if (typeof parent?.[maybeMethod] === 'function') {
      if (cache && cacheKey) cache.set(cacheKey, args.basePath);
      return args.basePath;
    }
  }

  const routeNode = resolveTreatyNode({
    client: args.client,
    path: args.basePath,
    params: args.params,
  });

  for (const method of args.methodOrder) {
    if (typeof routeNode?.[method] === 'function') {
      const resolved = [...args.basePath, method];
      if (cache && cacheKey) cache.set(cacheKey, resolved);
      return resolved;
    }
  }

  const location = args.basePath.length ? args.basePath.join('.') : '<root>';
  throw new Error(
    `treaty-tanstack-react-query: could not resolve "${args.util}" at ${location}. ` +
      `Available methods tried: ${args.methodOrder.join(', ')}`,
  );
}

export function createTreatyOptionsProxy<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
>(
  opts: TreatyOptionsProxyOptions<TClient, TFeatureFlags>,
): TreatyOptionsProxy<TClient, TFeatureFlags> {
  const prefix = (opts as any).keyPrefix as string | undefined;
  const procedurePathCache = new Map<string, readonly string[]>();

  const createProxy = (state: OptionsProxyState): any => {
    return new Proxy(function () {}, {
      get(_target, prop) {
        if (prop === 'then') return undefined;
        if (typeof prop !== 'string') return undefined;

        if (prop === 'index') {
          return createProxy(state);
        }

        return createProxy({
          ...state,
          path: [...state.path, prop],
        });
      },

      apply(_target, _thisArg, args) {
        const last = (state.path.length
          ? state.path[state.path.length - 1]
          : undefined) as UtilsMethods | undefined;

        if (last) {
          const utilName = last;
          const path = state.path.slice(0, -1);

          const [arg1, arg2] = args as any[];
          const queryClient = opts.queryClient;

          const utilMap: Record<UtilsMethods, () => unknown> = {
            '~types': () => undefined,

            pathKey: () => {
              return getQueryKeyInternal({
                path,
                type: 'any',
                prefix,
              });
            },
            pathFilter: () => {
              return {
                ...(arg1 as QueryFilters | undefined),
                queryKey: getQueryKeyInternal({
                  path,
                  type: 'any',
                  prefix,
                }),
              };
            },

            queryOptions: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_QUERY_METHOD_ORDER,
                util: 'queryOptions',
                cache: procedurePathCache,
                cacheKey: 'query',
              });
              const routePath = procedurePath.slice(0, -1);
              const keyInput = mergeParamInputs(state.params, arg1);
              const queryKey = getQueryKeyInternal({
                path: routePath,
                input: keyInput,
                type: 'query',
                prefix,
              }) as TreatyQueryKey<TFeatureFlags['keyPrefix']>;

              return treatyQueryOptions({
                client: opts.client,
                params: state.params,
                input: arg1,
                opts: arg2,
                path: procedurePath,
                methodExplicit:
                  typeof path[path.length - 1] === 'string' &&
                  DEFAULT_QUERY_METHOD_ORDER.includes(
                    path[path.length - 1] as (typeof DEFAULT_QUERY_METHOD_ORDER)[number],
                  ),
                queryClient,
                queryKey,
              });
            },
            queryKey: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_QUERY_METHOD_ORDER,
                util: 'queryKey',
                cache: procedurePathCache,
                cacheKey: 'query',
              });
              return getQueryKeyInternal({
                path: procedurePath.slice(0, -1),
                input: mergeParamInputs(state.params, arg1),
                type: 'query',
                prefix,
              });
            },
            queryFilter: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_QUERY_METHOD_ORDER,
                util: 'queryFilter',
                cache: procedurePathCache,
                cacheKey: 'query',
              });
              return {
                ...(arg2 as QueryFilters | undefined),
                queryKey: getQueryKeyInternal({
                  path: procedurePath.slice(0, -1),
                  input: mergeParamInputs(state.params, arg1),
                  type: 'query',
                  prefix,
                }),
              };
            },

            infiniteQueryOptions: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_QUERY_METHOD_ORDER,
                util: 'infiniteQueryOptions',
                cache: procedurePathCache,
                cacheKey: 'query',
              });
              const routePath = procedurePath.slice(0, -1);
              const keyInput = mergeParamInputs(state.params, arg1);
              const queryKey = getQueryKeyInternal({
                path: routePath,
                input: keyInput,
                type: 'infinite',
                prefix,
              }) as TreatyQueryKey<TFeatureFlags['keyPrefix']>;

              return treatyInfiniteQueryOptions({
                client: opts.client,
                params: state.params,
                input: arg1,
                opts: arg2,
                path: procedurePath,
                methodExplicit:
                  typeof path[path.length - 1] === 'string' &&
                  DEFAULT_QUERY_METHOD_ORDER.includes(
                    path[path.length - 1] as (typeof DEFAULT_QUERY_METHOD_ORDER)[number],
                  ),
                queryClient,
                queryKey,
              });
            },
            infiniteQueryKey: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_QUERY_METHOD_ORDER,
                util: 'infiniteQueryKey',
                cache: procedurePathCache,
                cacheKey: 'query',
              });
              return getQueryKeyInternal({
                path: procedurePath.slice(0, -1),
                input: mergeParamInputs(state.params, arg1),
                type: 'infinite',
                prefix,
              });
            },
            infiniteQueryFilter: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_QUERY_METHOD_ORDER,
                util: 'infiniteQueryFilter',
                cache: procedurePathCache,
                cacheKey: 'query',
              });
              return {
                ...(arg2 as QueryFilters | undefined),
                queryKey: getQueryKeyInternal({
                  path: procedurePath.slice(0, -1),
                  input: mergeParamInputs(state.params, arg1),
                  type: 'infinite',
                  prefix,
                }),
              };
            },

            mutationOptions: () => {
              const [maybeMethodOrOpts, maybeOpts] = args as any[];
              const explicitMethod =
                typeof maybeMethodOrOpts === 'string'
                  ? (maybeMethodOrOpts as string)
                  : undefined;
              const mutationOpts =
                typeof maybeMethodOrOpts === 'string'
                  ? (maybeOpts as any)
                  : (maybeMethodOrOpts as any);

              if (
                explicitMethod &&
                typeof path[path.length - 1] === 'string' &&
                DEFAULT_MUTATION_METHOD_ORDER.includes(
                  path[path.length - 1] as (typeof DEFAULT_MUTATION_METHOD_ORDER)[number],
                )
              ) {
                throw new Error(
                  `treaty-tanstack-react-query: cannot combine ".${path[path.length - 1]}…"` +
                    ` with \`mutationOptions('${explicitMethod}', ...)\`. ` +
                    `Drop the method property and use \`mutationOptions('${explicitMethod}', ...)\` instead.`,
                );
              }

              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: explicitMethod ? [...path, explicitMethod] : path,
                params: state.params,
                methodOrder: DEFAULT_MUTATION_METHOD_ORDER,
                util: 'mutationOptions',
                cache: procedurePathCache,
                cacheKey: 'mutation',
              });
              const mutationKey = getMutationKeyInternal({
                path: procedurePath.slice(0, -1),
                prefix,
              }) as TreatyMutationKey<TFeatureFlags['keyPrefix']>;

              return treatyMutationOptions({
                client: opts.client,
                params: state.params,
                opts: mutationOpts,
                path: procedurePath,
                methodExplicit:
                  typeof explicitMethod === 'string' ||
                  (typeof path[path.length - 1] === 'string' &&
                    DEFAULT_MUTATION_METHOD_ORDER.includes(
                      path[path.length - 1] as (typeof DEFAULT_MUTATION_METHOD_ORDER)[number],
                    )),
                queryClient,
                mutationKey,
                overrides: opts.overrides?.mutations,
              });
            },
            mutationKey: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_MUTATION_METHOD_ORDER,
                util: 'mutationKey',
                cache: procedurePathCache,
                cacheKey: 'mutation',
              });
              return getMutationKeyInternal({
                path: procedurePath.slice(0, -1),
                prefix,
              });
            },

            subscriptionOptions: () => {
              const procedurePath = resolveProcedurePath({
                client: opts.client,
                basePath: path,
                params: state.params,
                methodOrder: DEFAULT_SUBSCRIPTION_METHOD_ORDER,
                util: 'subscriptionOptions',
                cache: procedurePathCache,
                cacheKey: 'subscription',
              });
              const queryKey = getQueryKeyInternal({
                path: procedurePath.slice(0, -1),
                input: mergeParamInputs(state.params, arg1),
                type: 'any',
                prefix,
              }) as TreatyQueryKey<TFeatureFlags['keyPrefix']>;

              return treatySubscriptionOptions({
                client: opts.client,
                params: state.params,
                input: arg1,
                path: procedurePath,
                queryKey,
                opts: arg2,
              });
            },
          };

          if (utilName in utilMap) {
            return utilMap[utilName]();
          }
        }

        const [first] = args;
        const lastPathSegment = state.path[state.path.length - 1];
        if (typeof lastPathSegment === 'string' && RESERVED_METHOD_NAMES.has(lastPathSegment)) {
          throw new Error(
            `treaty-tanstack-react-query: attempted to call ".${lastPathSegment}(...)". ` +
              `Use "${lastPathSegment === 'get' || lastPathSegment === 'head' ? '.queryOptions(input?, opts?)' : lastPathSegment === 'subscribe' ? '.subscriptionOptions(input?, opts?)' : '.mutationOptions(opts?)'}" (or ".${lastPathSegment}.…") instead.`,
          );
        }

        if (args.length === 1 && isSingleKeyObject(first)) {
          const paramName = Object.keys(first)[0]!;
          return createProxy({
            path: [...state.path, `:${paramName}`],
            params: [...state.params, first],
          });
        }

        throw new Error(
          `treaty-tanstack-react-query: attempted to call a non-utility path (${state.path.join(
            '.',
          )}). Did you mean to call .queryOptions(), .mutationOptions(), or to provide a path param via ({ id: 123 })?`,
        );
      },
    });
  };

  return createProxy({ path: [], params: [] });
}
