import type { QueryClient } from "@tanstack/react-query";
import * as React from "react";
import type { MutationOptionsOverride } from "./mutationOptions";
import type {
  TreatyOptionsProxy,
  TreatyOptionsProxyOptions,
  TreatyUtilsProxy,
} from "./createOptionsProxy";
import { createTreatyOptionsProxy } from "./createOptionsProxy";
import type {
  DefaultFeatureFlags,
  FeatureFlags,
  KeyPrefixOptions,
} from "./types";

type TreatyProviderType<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags
> = React.FC<
  {
    children: React.ReactNode;
    queryClient: QueryClient;
    client: TClient;
    overrides?: {
      mutations?: MutationOptionsOverride;
    };
  } & KeyPrefixOptions<TFeatureFlags>
>;

export interface CreateTreatyContextResult<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags
> {
  TreatyProvider: TreatyProviderType<TClient, TFeatureFlags>;
  useTreaty: () => TreatyOptionsProxy<TClient, TFeatureFlags>;
  useTreatyUtils: () => TreatyUtilsProxy<TClient, TFeatureFlags>;
  useTreatyClient: () => TClient;
}

/**
 * Create a set of type-safe provider-consumers, similar to tRPC's createTRPCContext.
 */
export function createTreatyContext<
  TClient,
  TFeatureFlags extends FeatureFlags = DefaultFeatureFlags
>(): CreateTreatyContextResult<TClient, TFeatureFlags> {
  const TreatyClientContext = React.createContext<TClient | null>(null);
  const TreatyContext = React.createContext<TreatyOptionsProxy<
    TClient,
    TFeatureFlags
  > | null>(null);

  const TreatyProvider: TreatyProviderType<TClient, TFeatureFlags> = ({
    client,
    queryClient,
    overrides,
    children,
    ...rest
  }) => {
    const keyPrefix = "keyPrefix" in rest ? rest.keyPrefix : undefined;

    const value = React.useMemo(
      () =>
        createTreatyOptionsProxy<TClient, TFeatureFlags>({
          client,
          queryClient,
          overrides,
          ...(keyPrefix !== undefined ? { keyPrefix } : {}),
        } as TreatyOptionsProxyOptions<TClient, TFeatureFlags>),
      [client, queryClient, keyPrefix, overrides]
    );

    return (
      <TreatyClientContext.Provider value={client}>
        <TreatyContext.Provider value={value}>
          {children}
        </TreatyContext.Provider>
      </TreatyClientContext.Provider>
    );
  };
  TreatyProvider.displayName = "TreatyProvider";

  function useTreaty() {
    const utils = React.useContext(TreatyContext);
    if (!utils) {
      throw new Error(
        "useTreaty() can only be used inside of a <TreatyProvider>"
      );
    }
    return utils;
  }

  function useTreatyClient() {
    const client = React.useContext(TreatyClientContext);
    if (!client) {
      throw new Error(
        "useTreatyClient() can only be used inside of a <TreatyProvider>"
      );
    }
    return client;
  }

  function useTreatyUtils() {
    const utils = React.useContext(TreatyContext);
    if (!utils) {
      throw new Error(
        "useTreatyUtils() can only be used inside of a <TreatyProvider>"
      );
    }
    return utils as unknown as TreatyUtilsProxy<TClient, TFeatureFlags>;
  }

  return {
    TreatyProvider,
    useTreaty,
    useTreatyUtils,
    useTreatyClient,
  } as CreateTreatyContextResult<TClient, TFeatureFlags>;
}
