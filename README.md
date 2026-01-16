# treaty-tanstack-react-query

Type-safe [TanStack React Query](https://tanstack.com/query) integration for [Eden Treaty](https://elysiajs.com/eden/treaty/overview) (Elysia).

## Features

- **Full type safety** — Automatic inference from Elysia routes to `queryOptions` and `mutationOptions`
- **First-class TanStack Query v5** — Returns standard options objects that work with `useQuery`, `useMutation`, `useSuspenseQuery`, etc.
- **Smart query keys** — Hierarchical keys auto-generated from your API paths. Invalidate by path with `pathFilter()`
- **Infinite queries** — Automatic support when your input contains a `cursor` field
- **Real-time** — WebSocket subscriptions via `subscriptionOptions()` + `useSubscription()`
- **SSR & Suspense** — Full support for React Suspense, streaming SSR, and hydration

## Install

::: code-group

```bash [npm]
npm install treaty-tanstack-react-query @tanstack/react-query @elysiajs/eden
```

```bash [pnpm]
pnpm add treaty-tanstack-react-query @tanstack/react-query @elysiajs/eden
```

```bash [bun]
bun add treaty-tanstack-react-query @tanstack/react-query @elysiajs/eden
```

:::

## Quick Start

```tsx
import { treaty } from "@elysiajs/eden";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { createTreatyContext } from "treaty-tanstack-react-query";
import type { App } from "./server";

const client = treaty<App>("http://localhost:3000");
const queryClient = new QueryClient();

const { TreatyProvider, useTreaty } = createTreatyContext<typeof client>();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        <Users />
      </TreatyProvider>
    </QueryClientProvider>
  );
}

function Users() {
  const treaty = useTreaty();
  const { data } = useQuery(treaty.api.users.queryOptions());
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

## Documentation

Full documentation is available at [abanoubnassem.github.io/treaty-tanstack-query](https://abanoubnassem.github.io/treaty-tanstack-query/)

## Repository Structure

```
├── packages/
│   └── treaty-tanstack-react-query/   # The library
├── apps/
│   └── react-fullstack-example/       # Demo app
└── docs/                              # VitePress documentation
```

## Development

```bash
# Install dependencies
bun install

# Run the example app
turbo dev

# Run tests
turbo test

# Build
turbo build
```

## License

Apache-2.0
