import type {
  MutationFunction,
  QueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import type {
  DefaultFeatureFlags,
  FeatureFlags,
  ResolverDef,
  TreatyMutationKey,
  TreatyQueryOptionsResult,
} from './types';
import type { DistributiveOmit } from './types-utils';
import { createTreatyOptionsResult, unwrapLazyArg } from './utils';

type ReservedOptions = 'mutationKey' | 'mutationFn';

export type TreatyMutationOptionsIn<
  TInput,
  TError,
  TOutput,
  TContext,
> = DistributiveOmit<
  UseMutationOptions<TOutput, TError, TInput, TContext>,
  ReservedOptions
>;

export interface TreatyMutationOptionsOut<
  TInput,
  TError,
  TOutput,
  TContext,
  TFeatureFlags extends FeatureFlags,
> extends UseMutationOptions<TOutput, TError, TInput, TContext>,
    TreatyQueryOptionsResult {
  mutationKey: TreatyMutationKey<TFeatureFlags['keyPrefix']>;
}

export interface TreatyMutationOptions<
  TDef extends ResolverDef,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags,
> {
  <TContext = unknown>(
    opts?: TreatyMutationOptionsIn<TDef['input'], TDef['error'], TDef['output'], TContext>,
  ): TreatyMutationOptionsOut<
    TDef['input'],
    TDef['error'],
    TDef['output'],
    TContext,
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

export type MaybePromise<T> = T | Promise<T>;

export interface MutationOptionsOverride {
  onSuccess: (opts: {
    originalFn: () => MaybePromise<void>;
    queryClient: QueryClient;
    meta: Record<string, unknown>;
  }) => MaybePromise<void>;
}

type AnyTreatyMutationOptionsIn = TreatyMutationOptionsIn<
  unknown,
  unknown,
  unknown,
  unknown
>;

type AnyTreatyMutationOptionsOut = TreatyMutationOptionsOut<
  unknown,
  unknown,
  unknown,
  unknown,
  FeatureFlags
>;

type CallTreatyResult = {
  data: unknown;
  error: unknown;
};

const AUTO_MUTATION_METHOD_ORDER_WITH_PARAMS = [
  'patch',
  'delete',
  'put',
  'post',
  'options',
  'connect',
] as const;

const AUTO_MUTATION_METHOD_ORDER_NO_PARAMS = [
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'connect',
] as const;

type AutoMutationMethod =
  | (typeof AUTO_MUTATION_METHOD_ORDER_WITH_PARAMS)[number]
  | (typeof AUTO_MUTATION_METHOD_ORDER_NO_PARAMS)[number];

const autoMutationMethodCache = new WeakMap<object, Map<string, AutoMutationMethod>>();

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
    error.message.includes('treaty-tanstack-react-query: could not resolve client method')
  ) {
    return true;
  }

  const status = getErrorStatus(error);
  return status === 404 || status === 405;
}

function getAutoMethodOrder(routePath: string[]): readonly AutoMutationMethod[] {
  const hasPathParams = routePath.some((segment) => segment.startsWith(':'));
  return hasPathParams
    ? AUTO_MUTATION_METHOD_ORDER_WITH_PARAMS
    : AUTO_MUTATION_METHOD_ORDER_NO_PARAMS;
}

async function callTreatyMutation(args: {
  client: unknown;
  path: string[];
  params: Array<Record<string, unknown>>;
  input: unknown;
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

  return (await methodFn(args.input)) as CallTreatyResult;
}

export function treatyMutationOptions(args: {
  client: unknown;
  params: Array<Record<string, unknown>>;
  opts: AnyTreatyMutationOptionsIn | undefined;
  path: string[];
  methodExplicit: boolean;
  queryClient: QueryClient | (() => QueryClient);
  mutationKey: TreatyMutationKey<any>;
  overrides: MutationOptionsOverride | undefined;
}): AnyTreatyMutationOptionsOut {
  const { path, opts, mutationKey, overrides } = args;
  const queryClient = unwrapLazyArg(args.queryClient);

  const defaultOpts = queryClient.defaultMutationOptions(
    queryClient.getMutationDefaults(mutationKey),
  );

  const mutationSuccessOverride: MutationOptionsOverride['onSuccess'] =
    overrides?.onSuccess ?? ((options) => options.originalFn());

  const mutationFn: MutationFunction = async (input) => {
    if (path.length === 0) {
      throw new Error('treaty-tanstack-react-query: empty procedure path');
    }

    const routePath = path.slice(0, -1);
    const requestedMethod = path[path.length - 1] as string;

    if (args.methodExplicit) {
      const result = await callTreatyMutation({
        client: args.client,
        path,
        params: args.params,
        input,
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
        ? (autoMutationMethodCache.get(cacheOwner) ??
          (autoMutationMethodCache.set(cacheOwner, new Map()),
          autoMutationMethodCache.get(cacheOwner)!))
        : null;

    const cachedMethod = methodCache?.get(cacheKey);
    const order = getAutoMethodOrder(routePath);

    const candidates = cachedMethod
      ? ([cachedMethod, ...order.filter((m) => m !== cachedMethod)] as AutoMutationMethod[])
      : requestedMethod !== 'post' && order.includes(requestedMethod as AutoMutationMethod)
        ? ([
            requestedMethod as AutoMutationMethod,
            ...order.filter((m) => m !== (requestedMethod as AutoMutationMethod)),
          ] as AutoMutationMethod[])
        : (order as AutoMutationMethod[]);

    let lastError: unknown = undefined;

    for (const method of candidates) {
      try {
        const result = await callTreatyMutation({
          client: args.client,
          path: [...routePath, method],
          params: args.params,
          input,
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

    throw lastError ?? new Error(
      `treaty-tanstack-react-query: could not resolve a mutation method for ${cacheKey || '<root>'}`,
    );
  };

  return {
    ...opts,
    mutationKey,
    mutationFn,
    onSuccess(...args2) {
      const originalFn = async () => {
        if (opts?.onSuccess) {
          await opts.onSuccess(...args2);
          return;
        }
        if (defaultOpts?.onSuccess) {
          await defaultOpts.onSuccess(...args2);
        }
      };

    return mutationSuccessOverride({
      originalFn,
      queryClient,
      meta: (opts?.meta ?? defaultOpts?.meta ?? {}) as Record<string, unknown>,
    });
  },
    treaty: createTreatyOptionsResult({ path: path.slice(0, -1) }),
  };
}
