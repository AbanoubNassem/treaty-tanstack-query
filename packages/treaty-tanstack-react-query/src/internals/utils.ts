import type { QueryClient } from '@tanstack/react-query';
import { skipToken } from '@tanstack/react-query';
import type {
  AnyTreatyMutationKey,
  AnyTreatyQueryKey,
  FeatureFlags,
  QueryType,
  TreatyMutationKey,
  TreatyMutationKeyWithoutPrefix,
  TreatyQueryKey,
  TreatyQueryKeyWithoutPrefix,
  TreatyQueryKeyWithPrefix,
  TreatyQueryOptionsResult,
} from './types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return isObject(value) && Symbol.asyncIterator in value;
}

export function unwrapLazyArg<T>(valueOrLazy: T | (() => T)): T {
  return typeof valueOrLazy === 'function' ? (valueOrLazy as () => T)() : valueOrLazy;
}

export function createTreatyOptionsResult(value: {
  path: string[];
}): TreatyQueryOptionsResult['treaty'] {
  return {
    path: value.path.join('.'),
  };
}

export function isPrefixedQueryKey(
  queryKey: TreatyQueryKey<any>,
): queryKey is TreatyQueryKeyWithPrefix {
  return queryKey.length >= 3;
}

export function readQueryKey(queryKey: AnyTreatyQueryKey) {
  if (isPrefixedQueryKey(queryKey)) {
    return {
      type: 'prefixed' as const,
      prefix: queryKey[0],
      path: queryKey[1],
      args: queryKey[2],
    };
  }
  return {
    type: 'unprefixed' as const,
    prefix: undefined,
    path: queryKey[0],
    args: queryKey[1],
  };
}

/**
 * To allow easy interactions with groups of related queries, such as invalidating all
 * queries beneath a path, we store the route path as an array in the query key.
 */
export function getQueryKeyInternal(opts: {
  path: string[];
  input?: unknown;
  type: QueryType;
  prefix: string | undefined;
}): AnyTreatyQueryKey {
  const key = ((): TreatyQueryKeyWithoutPrefix => {
    const { input, type } = opts;
    const splitPath = opts.path.flatMap((part) => part.split('.'));

    if (!input && type === 'any') {
      return splitPath.length
        ? [splitPath]
        : ([] as unknown as TreatyQueryKeyWithoutPrefix);
    }

    if (type === 'infinite' && isObject(input)) {
      const shouldStrip =
        'cursor' in input ||
        'direction' in input ||
        (isObject((input as any).query) &&
          ('cursor' in (input as any).query || 'direction' in (input as any).query));

      if (shouldStrip) {
        const { cursor: _cursor, direction: _direction, ...inputRest } = input as any;
        const stripped: Record<string, unknown> = { ...inputRest };

        if (isObject(stripped.query)) {
          const {
            cursor: _queryCursor,
            direction: _queryDirection,
            ...queryRest
          } = stripped.query as any;
          stripped.query = queryRest;
        }

        return [
          splitPath,
          {
            input: stripped,
            type: 'infinite',
          },
        ];
      }
    }

    const args: TreatyQueryKeyWithoutPrefix[1] = {
      ...(typeof input !== 'undefined' &&
        input !== skipToken && { input }),
      ...(type !== 'any' && { type }),
    };

    return [splitPath, args];
  })();

  if (opts.prefix) {
    key.unshift([opts.prefix]);
  }
  return key;
}

export function getMutationKeyInternal(opts: {
  prefix: string | undefined;
  path: string[];
}): AnyTreatyMutationKey {
  const key: TreatyMutationKeyWithoutPrefix = [
    opts.path.flatMap((part) => part.split('.')),
  ];

  if (opts.prefix) {
    key.unshift([opts.prefix]);
  }
  return key;
}

export async function buildQueryFromAsyncIterable<
  TQueryKey extends TreatyQueryKey<any>,
>(
  asyncIterable: AsyncIterable<unknown>,
  queryClient: QueryClient,
  queryKey: TQueryKey,
) {
  const queryCache = queryClient.getQueryCache();

  const query = queryCache.build(queryClient, {
    queryKey,
  });

  query.setState({
    data: [],
    status: 'success',
  });

  const aggregate: unknown[] = [];
  for await (const value of asyncIterable) {
    aggregate.push(value);
    query.setState({ data: [...aggregate] });
  }
  return aggregate;
}
