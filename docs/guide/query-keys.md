# Query Keys

Treaty TanStack Query automatically generates hierarchical query keys that make cache management intuitive and type-safe.

## Accessing Query Keys

Use `queryKey()` from the treaty proxy:

```tsx
const treaty = useTreaty()

// Get the query key for a route
const key = treaty.api.users.queryKey()
// → ['api', 'users', 'get']

// With route parameters
const keyWithParams = treaty.api.users({ id: '1' }).queryKey()
// → ['api', 'users', { id: '1' }, 'get']
```

## Cache Invalidation with pathFilter()

Use `pathFilter()` for cache invalidation via route hierarchy:

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

// Invalidate ALL queries under /api/users (including /api/users/:id)
queryClient.invalidateQueries(treaty.api.users.pathFilter())

// Invalidate specific user only
queryClient.invalidateQueries(treaty.api.users({ id: '1' }).pathFilter())
```

## Setting Cache Data

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

// Set data for a specific query
queryClient.setQueryData(
  treaty.api.users({ id: '1' }).queryKey(),
  { id: '1', name: 'Alice Updated' }
)

// Get cached data
const cachedUser = queryClient.getQueryData(
  treaty.api.users({ id: '1' }).queryKey()
)
```

## Common Patterns

### After Creating a Resource

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

const createUser = useMutation(
  treaty.api.users.mutationOptions({
    onSuccess() {
      // Invalidate the users list
      queryClient.invalidateQueries(treaty.api.users.pathFilter())
    }
  })
)
```

### After Updating a Resource

```tsx
const updateUser = useMutation(
  treaty.api.users({ id: userId }).mutationOptions({
    onSuccess() {
      // Invalidate this specific user
      queryClient.invalidateQueries(
        treaty.api.users({ id: userId }).pathFilter()
      )
    }
  })
)
```

### After Deleting a Resource

```tsx
const deleteUser = useMutation(
  treaty.api.users({ id: userId }).mutationOptions('delete', {
    onSuccess() {
      // Remove from cache entirely
      queryClient.removeQueries({
        queryKey: treaty.api.users({ id: userId }).queryKey()
      })
      // Invalidate the list to refetch
      queryClient.invalidateQueries(treaty.api.users.pathFilter())
    }
  })
)
```

## Key Format Details

Keys are arrays with these segments:

1. **Path segments** - Each URL segment becomes an array element
2. **Parameters** - Route params are objects in the array
3. **Method** - The HTTP method is the final segment

```ts
// GET /api/organizations/:orgId/teams/:teamId/members
treaty.api.organizations({ orgId: 'a' }).teams({ teamId: 'b' }).members.queryKey()

// Results in:
['api', 'organizations', { orgId: 'a' }, 'teams', { teamId: 'b' }, 'members', 'get']
```

## pathFilter() vs queryKey()

| Method | Use Case |
|--------|----------|
| `queryKey()` | Get/set specific cache entries |
| `pathFilter()` | Invalidate queries matching a path prefix |

```tsx
// queryKey() - exact match for cache operations
queryClient.getQueryData(treaty.api.users.queryKey())
queryClient.setQueryData(treaty.api.users.queryKey(), newData)

// pathFilter() - prefix matching for invalidation
queryClient.invalidateQueries(treaty.api.users.pathFilter())
// Matches: /api/users, /api/users/1, /api/users/2, etc.
```

This hierarchical structure enables precise cache control at any level.
