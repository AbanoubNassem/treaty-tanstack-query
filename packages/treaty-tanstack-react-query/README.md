# treaty-tanstack-react-query

Type-safe TanStack React Query options + query keys for Eden Treaty clients (Elysia).

## Install

```bash
bun add treaty-tanstack-react-query
```

Peer deps:

- `@elysiajs/eden`
- `@tanstack/react-query` (v5+)
- `react` / `react-dom`

## Quick start (React)

```tsx
import { treaty } from "@elysiajs/eden";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { createTreatyContext } from "treaty-tanstack-react-query";
import type { app } from "./server";

const client = treaty<typeof app>("localhost:3000");
const queryClient = new QueryClient();

const { TreatyProvider, useTreaty } = createTreatyContext<typeof client>();

function Todos() {
  const treaty = useTreaty();
  const { data } = useQuery(treaty.api.todos.queryOptions());
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        <Todos />
      </TreatyProvider>
    </QueryClientProvider>
  );
}
```

## What you get

- `queryOptions()` / `queryKey()` for queries (`get`/`head`)
- `mutationOptions()` / `mutationKey()` for mutations (`post`/`put`/`patch`/`delete` and more)
- `infiniteQueryOptions()` when your input contains `cursor` (or `query.cursor`)
- `pathFilter()` helpers for cache invalidation and cancellation
- `subscriptionOptions()` + `useSubscription()` for WebSocket subscriptions
- Type helpers: `inferInput`, `inferOutput`

## Repo docs

If you’re in the monorepo:

- Main README: `README.md`
- Guide: `docs/guide.md`
- Example app: `apps/react-fullstack-example`
