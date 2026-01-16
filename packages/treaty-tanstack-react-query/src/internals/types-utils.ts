export type DistributiveOmit<TObj, TKey extends PropertyKey> = TObj extends any
  ? Omit<TObj, TKey>
  : never;

export type coerceAsyncIterableToArray<T> = T extends AsyncIterable<infer TItem>
  ? TItem[]
  : T;

