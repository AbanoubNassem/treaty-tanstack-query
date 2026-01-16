# Getting Started

Treaty TanStack Query provides type-safe TanStack Query integration for [Eden Treaty](https://elysiajs.com/eden/treaty/overview.html) clients.

## Prerequisites

- An [Elysia](https://elysiajs.com) backend
- A React frontend with [TanStack Query v5](https://tanstack.com/query)
- [Eden Treaty](https://elysiajs.com/eden/treaty/overview.html) set up

## Installation

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

## Setup

### 1. Create your Elysia app (server)

```ts
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get('/api/users', () => [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
  .get('/api/users/:id', ({ params }) => ({
    id: params.id,
    name: 'Alice'
  }))
  .post('/api/users', ({ body }) => ({
    id: 3,
    ...body
  }), {
    body: t.Object({
      name: t.String()
    })
  })
  .listen(3000)

export type App = typeof app
```

### 2. Create the Treaty client and context

```ts
// lib/treaty.ts
import { treaty } from '@elysiajs/eden'
import { createTreatyContext } from 'treaty-tanstack-react-query'
import type { App } from '../server'

export const client = treaty<App>('http://localhost:3000')

export const { TreatyProvider, useTreaty } =
  createTreatyContext<typeof client>()
```

### 3. Set up providers

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreatyProvider, client } from './lib/treaty'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        <YourApp />
      </TreatyProvider>
    </QueryClientProvider>
  )
}
```

### 4. Use in components

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTreaty } from './lib/treaty'

function Users() {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  // Queries - fully typed!
  const { data: users } = useQuery(
    treaty.api.users.queryOptions()
  )

  // Mutations - also typed!
  const createUser = useMutation(
    treaty.api.users.mutationOptions({
      onSuccess() {
        // Invalidate all queries under /api/users
        queryClient.invalidateQueries(treaty.api.users.pathFilter())
      }
    })
  )

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => createUser.mutate({ name: 'Charlie' })}>
        Add User
      </button>
    </div>
  )
}
```

## What's Next?

- Learn [why this library exists](/guide/why)
- Understand [query options](/guide/query-options) in depth
- Explore [query keys](/guide/query-keys) for cache management
