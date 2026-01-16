export type {
  TreatyOptionsProxy,
  TreatyUtilsProxy,
  inferInput,
  inferOutput,
  DecorateInfiniteQueryProcedure,
  DecorateMutationProcedure,
  DecorateProcedure,
  DecorateQueryProcedure,
  DecorateSubscriptionProcedure,
  DecorateTreatyClient,
  DecorateRouterKeyable,
} from './internals/createOptionsProxy';
export { createTreatyOptionsProxy } from './internals/createOptionsProxy';
export {
  createTreatyContext,
  type CreateTreatyContextResult,
} from './internals/Context';
export type { TreatyQueryOptions } from './internals/queryOptions';
export type { TreatyInfiniteQueryOptions } from './internals/infiniteQueryOptions';
export type { TreatyMutationOptions } from './internals/mutationOptions';
export { useSubscription } from './internals/subscriptionOptions';
export type {
  TreatySubscriptionOptions,
  TreatySubscriptionStatus,
  TreatySubscriptionConnectingResult,
  TreatySubscriptionErrorResult,
  TreatySubscriptionIdleResult,
  TreatySubscriptionPendingResult,
  TreatySubscriptionResult,
  TreatyConnectionState,
  Unsubscribable,
} from './internals/subscriptionOptions';
export type * from './internals/types';
