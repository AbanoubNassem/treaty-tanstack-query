# SSR & Hydration

Treaty TanStack Query works seamlessly with server-side rendering and hydration.

## Basic SSR Setup

### 1. Create the Treaty Client and Context

```ts
// lib/treaty.ts
import { treaty } from '@elysiajs/eden'
import type { QueryClient } from '@tanstack/react-query'
import { createTreatyContext, createTreatyOptionsProxy } from 'treaty-tanstack-react-query'
import type { App } from './server'

export const client = treaty<App>('http://localhost:3000')

// For client-side (context-based)
export const { TreatyProvider, useTreaty } =
  createTreatyContext<typeof client>()

// For server-side (direct usage without context)
export function createServerTreaty(queryClient: QueryClient) {
  return createTreatyOptionsProxy({ client, queryClient })
}
```

### 2. Prefetch on Server (Next.js App Router)

```tsx
// app/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createServerTreaty } from '@/lib/treaty'
import { Users } from './users'

export default async function Page() {
  const queryClient = new QueryClient()
  const treaty = createServerTreaty(queryClient)

  // Prefetch on server
  await queryClient.prefetchQuery(treaty.api.users.queryOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Users />
    </HydrationBoundary>
  )
}
```

### 3. Use in Client Component

```tsx
// app/users.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useTreaty } from '@/lib/treaty'

export function Users() {
  const treaty = useTreaty()

  // Data is already available from SSR!
  const { data } = useQuery(treaty.api.users.queryOptions())

  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

## React Server Components

For RSC, fetch directly with the Eden Treaty client:

```tsx
// app/page.tsx
import { client } from '@/lib/treaty'

export default async function Page() {
  // Direct fetch in RSC
  const { data: users } = await client.api.users.get()

  return (
    <ul>
      {users?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

Then use Treaty TanStack Query in client components that need reactivity:

```tsx
// components/user-actions.tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTreaty } from '@/lib/treaty'

export function DeleteUserButton({ userId }: { userId: string }) {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  const deleteUser = useMutation(
    treaty.api.users({ id: userId }).mutationOptions('delete', {
      onSuccess() {
        queryClient.invalidateQueries(treaty.api.users.pathFilter())
      }
    })
  )

  return (
    <button onClick={() => deleteUser.mutate(undefined)}>
      Delete
    </button>
  )
}
```

## Streaming SSR with Suspense

```tsx
// app/layout.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreatyProvider, client } from '@/lib/treaty'
import { useState } from 'react'

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        {children}
      </TreatyProvider>
    </QueryClientProvider>
  )
}
```

```tsx
// app/page.tsx
import { Suspense } from 'react'
import { Users } from './users'

export default function Page() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <Users />
    </Suspense>
  )
}
```

```tsx
// app/users.tsx
'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useTreaty } from '@/lib/treaty'

export function Users() {
  const treaty = useTreaty()

  // Suspense query - streams to client
  const { data } = useSuspenseQuery(treaty.api.users.queryOptions())

  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

## Important Notes

1. **Same Query Keys**: Server and client must generate identical query keys for hydration
2. **Serializable Data**: Ensure API responses are JSON-serializable
3. **Error Boundaries**: Use error boundaries to catch SSR errors
4. **Stale Time**: Set `staleTime` to avoid immediate refetches after hydration

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000 // 1 minute
    }
  }
})
```
