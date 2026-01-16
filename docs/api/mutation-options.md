# mutationOptions()

Generates TanStack Query mutation options for POST, PUT, PATCH, DELETE requests.

## Signature

```ts
// Default (POST)
treaty.path.to.route.mutationOptions(
  options?: MutationOptions
): UseMutationOptions

// Specific method
treaty.path.to.route.mutationOptions(
  method: 'post' | 'put' | 'patch' | 'delete',
  options?: MutationOptions
): UseMutationOptions
```

## Parameters

### `method` (optional)

HTTP method to use. Defaults to `'post'`.

- `'post'` - Create resource (default)
- `'put'` - Replace resource
- `'patch'` - Update resource
- `'delete'` - Delete resource

### `options` (optional)

TanStack Query mutation options:

```ts
{
  onSuccess?: (data, variables, context) => void
  onError?: (error, variables, context) => void
  onMutate?: (variables) => Promise<context> | context
  onSettled?: (data, error, variables, context) => void
  retry?: number | boolean
  retryDelay?: number
  // ... all UseMutationOptions
}
```

## Returns

A `UseMutationOptions` object compatible with `useMutation`.

## Examples

### Basic POST

```tsx
const createUser = useMutation(
  treaty.api.users.mutationOptions()
)

createUser.mutate({ name: 'Alice' })
```

### PUT (Update)

```tsx
const updateUser = useMutation(
  treaty.api.users({ id: userId }).mutationOptions('put')
)

updateUser.mutate({ name: 'Alice Updated' })
```

### DELETE

```tsx
const deleteUser = useMutation(
  treaty.api.users({ id: userId }).mutationOptions('delete')
)

deleteUser.mutate(undefined)
```

### With Cache Invalidation

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

const createUser = useMutation(
  treaty.api.users.mutationOptions({
    onSuccess() {
      queryClient.invalidateQueries(treaty.api.users.pathFilter())
    }
  })
)
```

### With Optimistic Updates

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

const updateUser = useMutation(
  treaty.api.users({ id }).mutationOptions({
    onMutate: async (newData) => {
      await queryClient.cancelQueries(treaty.api.users.pathFilter())
      const previous = queryClient.getQueryData(treaty.api.users.queryKey())
      queryClient.setQueryData(treaty.api.users.queryKey(), (old) =>
        old?.map(u => u.id === id ? { ...u, ...newData } : u)
      )
      return { previous }
    },
    onError: (err, vars, ctx) => {
      queryClient.setQueryData(treaty.api.users.queryKey(), ctx?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries(treaty.api.users.pathFilter())
    }
  })
)
```
