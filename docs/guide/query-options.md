# Query Options

`queryOptions()` generates TanStack Query options objects from your Eden Treaty routes.

## Basic Usage

```tsx
import { useQuery } from '@tanstack/react-query'
import { useTreaty } from './lib/treaty'

function Users() {
  const treaty = useTreaty()

  const { data, isLoading, error } = useQuery(
    treaty.api.users.queryOptions()
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## With Route Parameters

For routes with parameters (like `/api/users/:id`):

```tsx
function UserProfile({ userId }: { userId: string }) {
  const treaty = useTreaty()

  const { data } = useQuery(
    treaty.api.users({ id: userId }).queryOptions()
  )

  return <div>{data?.name}</div>
}
```

## With Query Parameters

Pass query parameters in the first argument:

```tsx
// Route: GET /api/users?role=admin&limit=10
const { data } = useQuery(
  treaty.api.users.queryOptions({
    query: {
      role: 'admin',
      limit: 10
    }
  })
)
```

## Overriding Options

Pass TanStack Query options as the second argument:

```tsx
const { data } = useQuery(
  treaty.api.users.queryOptions(
    { query: { status: 'active' } }, // Eden params
    {
      // TanStack Query options
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: !!userId,
      refetchOnWindowFocus: false,
      select: (data) => data.filter(u => u.active)
    }
  )
)
```

Or without Eden params:

```tsx
const { data } = useQuery(
  treaty.api.users.queryOptions(undefined, {
    refetchInterval: 5000 // Auto-refresh every 5s
  })
)
```

## With Suspense

Works seamlessly with `useSuspenseQuery`:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'

function Users() {
  const treaty = useTreaty()

  // TypeScript knows data is never undefined
  const { data } = useSuspenseQuery(
    treaty.api.users.queryOptions()
  )

  return <div>{data.length} users</div>
}

// Wrap with Suspense boundary
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Users />
    </Suspense>
  )
}
```

## Skip Token

Use the `enabled` option to conditionally disable queries:

```tsx
function UserProfile({ userId }: { userId: string | null }) {
  const treaty = useTreaty()

  const { data } = useQuery(
    treaty.api.users({ id: userId ?? '' }).queryOptions(undefined, {
      enabled: !!userId
    })
  )

  return data ? <div>{data.name}</div> : null
}
```

## Prefetching

Prefetch queries in loaders or event handlers:

```tsx
const queryClient = useQueryClient()
const treaty = useTreaty()

// In a loader
async function loader() {
  await queryClient.prefetchQuery(
    treaty.api.users.queryOptions()
  )
}

// On hover
function UserLink({ userId }: { userId: string }) {
  const prefetch = () => {
    queryClient.prefetchQuery(
      treaty.api.users({ id: userId }).queryOptions()
    )
  }

  return (
    <Link to={`/users/${userId}`} onMouseEnter={prefetch}>
      View User
    </Link>
  )
}
```

## Query Keys

Access query keys directly:

```tsx
const treaty = useTreaty()

// Get the query key for a route
const key = treaty.api.users.queryKey()
// → ['api', 'users', 'get']

const keyWithParams = treaty.api.users({ id: '1' }).queryKey()
// → ['api', 'users', { id: '1' }, 'get']
```

## Return Type

The generated options object includes:

```ts
{
  queryKey: ['api', 'users', 'get'],     // Automatic hierarchical key
  queryFn: () => client.api.users.get(), // Bound to your treaty client
  // ... any overrides you pass
}
```

This is a standard TanStack Query options object that works with all Query features.
