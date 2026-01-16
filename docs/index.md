---
layout: home

hero:
  name: Treaty TanStack Query
  text: Type-safe React Query for Elysia
  tagline: End-to-end type safety from your Elysia server to your React components
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/AbanoubNassem/treaty-tanstack-query

features:
  - icon: 🔒
    title: Full Type Safety
    details: Automatic type inference from your Elysia routes to queryOptions and mutationOptions. No manual typing required.
  - icon: ⚡
    title: First-class TanStack Query
    details: Built for TanStack Query v5. Returns standard queryOptions/mutationOptions objects that work everywhere.
  - icon: 🎯
    title: Smart Query Keys
    details: Automatically generated, hierarchical query keys. Invalidate by path using pathFilter().
  - icon: 🔄
    title: Real-time Ready
    details: Built-in WebSocket subscription support with useSubscription hook for real-time updates.
  - icon: 📦
    title: Zero Config
    details: Works out of the box with Eden Treaty. Just wrap your app and start querying.
  - icon: 🚀
    title: Suspense & SSR
    details: Full support for React Suspense, streaming SSR, and hydration.
---

## Quick Start

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

```tsx
import { treaty } from "@elysiajs/eden";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { createTreatyContext } from "treaty-tanstack-react-query";
import type { App } from "./server";

// Create treaty client and context
const client = treaty<App>("http://localhost:3000");
const queryClient = new QueryClient();

const { TreatyProvider, useTreaty } = createTreatyContext<typeof client>();

// Wrap your app
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        <Users />
      </TreatyProvider>
    </QueryClientProvider>
  );
}

// Use type-safe queries
function Users() {
  const treaty = useTreaty();

  const { data } = useQuery(
    treaty.api.users.queryOptions() // ✨ Fully typed!
  );

  return <div>{data?.[0]?.name}</div>;
}
```
