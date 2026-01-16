import type { InfiniteData } from '@tanstack/react-query';

/**
 * Turn a set of optional properties into required.
 */
export type WithRequired<TObj, TKey extends keyof TObj> = TObj & {
  [P in TKey]-?: TObj[P];
};

export type QueryType = 'any' | 'infinite' | 'query';

type CursorInput = { cursor?: any } | { query?: { cursor?: any } };
export type OptionalCursorInput = CursorInput | void;

type HasKnownProperty<TObj, TKey extends PropertyKey> = TKey extends keyof TObj
  ? string extends keyof TObj
    ? false
    : number extends keyof TObj
      ? false
      : symbol extends keyof TObj
        ? false
        : true
  : false;

export type ExtractCursorType<TInput> = Exclude<TInput, undefined> extends infer T
  ? [T] extends [object]
    ? HasKnownProperty<T, 'cursor'> extends true
      ? T extends { cursor?: infer TCursor }
        ? TCursor
        : unknown
      : T extends { query?: infer TQuery }
        ? Exclude<TQuery, undefined> extends infer TQueryObject
          ? [TQueryObject] extends [object]
            ? HasKnownProperty<TQueryObject, 'cursor'> extends true
              ? TQueryObject extends { cursor?: infer TCursor }
                ? TCursor
                : unknown
              : unknown
            : unknown
          : unknown
        : unknown
    : unknown
  : unknown;

export type TreatyInfiniteData<TInput, TOutput> = InfiniteData<
  TOutput,
  NonNullable<ExtractCursorType<TInput>> | null
>;

export type TreatyQueryKeyWithoutPrefix = [
  path: string[],
  opts?: { input?: unknown; type?: Exclude<QueryType, 'any'> },
];

export type TreatyQueryKeyWithPrefix = [
  prefix: string[],
  ...TreatyQueryKeyWithoutPrefix,
];

export type TreatyQueryKey<TPrefixEnabled extends boolean = false> =
  TPrefixEnabled extends true ? TreatyQueryKeyWithPrefix : TreatyQueryKeyWithoutPrefix;

export type AnyTreatyQueryKey = TreatyQueryKeyWithoutPrefix | TreatyQueryKeyWithPrefix;

export type TreatyMutationKeyWithoutPrefix = [path: string[]];
export type TreatyMutationKeyWithPrefix = [
  prefix: string[],
  ...TreatyMutationKeyWithoutPrefix,
];

export type TreatyMutationKey<TPrefixEnabled extends boolean = false> =
  TPrefixEnabled extends true
    ? TreatyMutationKeyWithPrefix
    : TreatyMutationKeyWithoutPrefix;

export type AnyTreatyMutationKey =
  | TreatyMutationKeyWithoutPrefix
  | TreatyMutationKeyWithPrefix;

export type FeatureFlags = { keyPrefix: boolean };

export type ofFeatureFlags<T extends FeatureFlags> = T;

export type DefaultFeatureFlags = ofFeatureFlags<{ keyPrefix: false }>;

export type KeyPrefixOptions<TFeatureFlags extends FeatureFlags> =
  TFeatureFlags['keyPrefix'] extends true
    ? {
        keyPrefix: string;
      }
    : {
        keyPrefix?: never;
      };

export type ResolverDef = {
  input: any;
  output: any;
  error: any;
  featureFlags: FeatureFlags;
};

export interface TreatyQueryOptionsResult {
  treaty: {
    path: string;
  };
}

export interface TreatyReactRequestOptions {
  /**
   * When enabled, the request will receive React Query's abort `signal`
   * (via Treaty `fetch: { signal }`).
   */
  abortOnUnmount?: boolean;
}

export interface TreatyQueryBaseOptions {
  /**
   * treaty-related options
   */
  treaty?: TreatyReactRequestOptions;
}
