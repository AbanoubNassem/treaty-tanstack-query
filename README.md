<p align="center">
  <img src="docs/public/logo.svg" alt="treaty-tanstack-query" width="120" />
</p>

<h1 align="center">treaty-tanstack-query</h1>

<p align="center">
  Type-safe <a href="https://tanstack.com/query">TanStack Query</a> integration for <a href="https://elysiajs.com/eden/treaty/overview">Eden Treaty</a> (Elysia)
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/treaty-tanstack-react-query"><img src="https://img.shields.io/npm/v/treaty-tanstack-react-query?style=flat-square&color=f472b6" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/treaty-tanstack-react-query"><img src="https://img.shields.io/npm/dm/treaty-tanstack-react-query?style=flat-square&color=10b981" alt="npm downloads" /></a>
  <a href="https://github.com/AbanoubNassem/treaty-tanstack-query/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/treaty-tanstack-react-query?style=flat-square&color=6366f1" alt="license" /></a>
  <a href="https://github.com/AbanoubNassem/treaty-tanstack-query/actions"><img src="https://img.shields.io/github/actions/workflow/status/AbanoubNassem/treaty-tanstack-query/ci.yml?style=flat-square&label=CI" alt="CI status" /></a>
  <a href="https://abanoubnassem.github.io/treaty-tanstack-query/"><img src="https://img.shields.io/badge/docs-vitepress-646cff?style=flat-square" alt="docs" /></a>
</p>

<p align="center">
  <a href="https://abanoubnassem.github.io/treaty-tanstack-query/">Documentation</a> ·
  <a href="https://github.com/AbanoubNassem/treaty-tanstack-query/issues">Report Bug</a>
</p>

---

## Why?

Using Eden Treaty with TanStack Query manually requires repetitive boilerplate:

```tsx
// Without treaty-tanstack-query 😫
const fetchTasks = async (filters: TaskFilters) => {
  const response = await client.api.tasks.get({ query: filters });
  if (response.error) throw response.error;
  return response.data;
};

const { data } = useQuery({
  queryKey: ['api', 'tasks', filters],  // Easy to typo!
  queryFn: () => fetchTasks(filters),
});

// Mutation with manual invalidation
const createTask = useMutation({
  mutationFn: async (input: CreateTaskInput) => {
    const response = await client.api.tasks.post(input);
    if (response.error) throw response.error;
    return response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['api', 'tasks'] }); // Hope you remembered the key!
  },
});
```

**With this library, it becomes:**

```tsx
// With treaty-tanstack-query 🎉
const treaty = useTreaty();
const queryClient = useQueryClient();

const { data } = useQuery(treaty.api.tasks.queryOptions({ query: filters }));

const createTask = useMutation(
  treaty.api.tasks.mutationOptions({
    onSuccess: () => queryClient.invalidateQueries(treaty.api.tasks.pathFilter()),
  })
);
```

## Features

- **Full type safety** — Automatic inference from Elysia routes to `queryOptions` and `mutationOptions`
- **First-class TanStack Query v5** — Returns standard options objects that work with `useQuery`, `useMutation`, `useSuspenseQuery`, etc.
- **Smart query keys** — Hierarchical keys auto-generated from your API paths. Invalidate by path with `pathFilter()`
- **Infinite queries** — Automatic support when your input contains a `cursor` field
- **Real-time** — WebSocket subscriptions via `subscriptionOptions()` + `useSubscription()`
- **SSR & Suspense** — Full support for React Suspense, streaming SSR, and hydration

## Install

```bash
npm install treaty-tanstack-react-query @tanstack/react-query @elysiajs/eden
```

<details>
<summary>Other package managers</summary>

```bash
pnpm add treaty-tanstack-react-query @tanstack/react-query @elysiajs/eden
```

```bash
bun add treaty-tanstack-react-query @tanstack/react-query @elysiajs/eden
```

</details>

## Quick Start

```tsx
import { treaty } from "@elysiajs/eden";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { createTreatyContext } from "treaty-tanstack-react-query";
import type { App } from "./server"; // Your Elysia app type

// 1. Create the Eden client
const client = treaty<App>("http://localhost:3000");

// 2. Create the treaty context
const { TreatyProvider, useTreaty } = createTreatyContext<typeof client>();

// 3. Setup providers
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        <Tasks />
      </TreatyProvider>
    </QueryClientProvider>
  );
}

// 4. Use in components with full type safety!
function Tasks() {
  const treaty = useTreaty();

  // ✅ Fully typed - IDE autocomplete shows available endpoints
  const { data: tasks } = useQuery(
    treaty.api.tasks.queryOptions({ query: { status: "todo" } })
  );

  return (
    <ul>
      {tasks?.map(task => <li key={task.id}>{task.title}</li>)}
    </ul>
  );
}
```

## Examples

### Queries with Filters

```tsx
const { data } = useQuery(
  treaty.api.tasks.queryOptions({
    query: { status: "in-progress", priority: "high" }
  })
);
```

### Mutations

```tsx
const treaty = useTreaty();
const queryClient = useQueryClient();

const updateTask = useMutation(
  treaty.api.tasks({ id: taskId }).mutationOptions('patch', {
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries(treaty.api.tasks.pathFilter());
    },
  })
);

updateTask.mutate({ status: "done" });
```

### Infinite Queries

```tsx
// Automatically detected when your endpoint has a `cursor` parameter
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  treaty.api.tasks.infinite.infiniteQueryOptions({
    query: { limit: 10 }
  })
);
```

### Real-time Subscriptions

```tsx
const treaty = useTreaty();
const queryClient = useQueryClient();

const { lastMessage } = useSubscription(
  treaty.ws.tasks.subscriptionOptions()
);

useEffect(() => {
  if (lastMessage?.type === "task-updated") {
    queryClient.invalidateQueries(treaty.api.tasks.pathFilter());
  }
}, [lastMessage]);
```

## Documentation

Full documentation is available at **[abanoubnassem.github.io/treaty-tanstack-query](https://abanoubnassem.github.io/treaty-tanstack-query/)**

- [Getting Started](https://abanoubnassem.github.io/treaty-tanstack-query/guide/getting-started)
- [Query Options](https://abanoubnassem.github.io/treaty-tanstack-query/guide/query-options)
- [Mutation Options](https://abanoubnassem.github.io/treaty-tanstack-query/guide/mutation-options)
- [Infinite Queries](https://abanoubnassem.github.io/treaty-tanstack-query/guide/infinite-queries)
- [WebSocket Subscriptions](https://abanoubnassem.github.io/treaty-tanstack-query/guide/subscriptions)
- [SSR & Suspense](https://abanoubnassem.github.io/treaty-tanstack-query/guide/ssr)

## Repository Structure

```
├── packages/
│   └── treaty-tanstack-react-query/   # The library
├── apps/
│   └── react-fullstack-example/       # Demo app (Task Manager)
└── docs/                              # VitePress documentation
```

## Development

```bash
# Install dependencies
bun install

# Run the example app
bun run dev

# Run tests
bun run test

# Build
bun run build
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## License

[Apache-2.0](LICENSE) © [Abanoub Nassem](https://github.com/AbanoubNassem)

---

<p align="center">
  <sub>Built with ❤️ for the Elysia + TanStack Query community</sub>
</p>
