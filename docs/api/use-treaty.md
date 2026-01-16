# useTreaty()

Hook to access the treaty options proxy within components.

## Signature

```ts
const treaty = useTreaty()
```

## Returns

A proxy object that mirrors your Elysia API routes with the following methods:

### `.queryOptions(params?, options?)`

Generate query options for GET requests.

```tsx
treaty.api.users.queryOptions()
treaty.api.users({ id }).queryOptions()
treaty.api.users.queryOptions({ query: { limit: 10 } })
```

### `.mutationOptions(method?, options?)`

Generate mutation options for POST/PUT/PATCH/DELETE.

```tsx
treaty.api.users.mutationOptions()           // POST
treaty.api.users({ id }).mutationOptions('put')
treaty.api.users({ id }).mutationOptions('delete')
```

### `.infiniteQueryOptions(params?, options)`

Generate infinite query options for pagination.

```tsx
treaty.api.posts.infiniteQueryOptions(
  { query: { limit: 10 } },
  { initialCursor: 0, getNextPageParam: (p) => p.nextCursor }
)
```

### `.queryKey()`

Get the query key for cache operations.

```tsx
treaty.api.users.queryKey()
// → ['api', 'users', 'get']
```

### `.pathKey()`

Get a query key prefix for a route subtree.

```tsx
treaty.api.users.pathKey()
```

On `useTreaty()`, this is only available when the node is an endpoint (it has an HTTP method like `get`/`post`). For route groups (non-endpoints), use `useTreatyUtils()`.

### `.pathFilter(filters?)`

Get a `QueryFilters` object for invalidation/cancellation by route subtree.

```tsx
treaty.api.users.pathFilter()
```

On `useTreaty()`, this is only available when the node is an endpoint (it has an HTTP method like `get`/`post`). For route groups (non-endpoints), use `useTreatyUtils()`.

### `.subscriptionOptions(params?, options)`

Generate subscription options for WebSocket connections.

```tsx
treaty.ws.events.subscriptionOptions(undefined, {
  enabled: true,
  onData: (data) => console.log(data)
})
```

## Example

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTreaty } from './lib/treaty'

function UserProfile({ userId }: { userId: string }) {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  // Query
  const { data: user } = useQuery(
    treaty.api.users({ id: userId }).queryOptions()
  )

  // Mutation
  const updateUser = useMutation(
    treaty.api.users({ id: userId }).mutationOptions({
      onSuccess() {
        queryClient.invalidateQueries(treaty.api.users.pathFilter())
      }
    })
  )

  // Cache access
  const cachedUsers = queryClient.getQueryData(
    treaty.api.users.queryKey()
  )

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => updateUser.mutate({ name: 'New Name' })}>
        Update
      </button>
    </div>
  )
}
```
