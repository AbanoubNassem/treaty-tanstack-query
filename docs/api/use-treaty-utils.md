# pathFilter()

Use `pathFilter()` from the treaty proxy to create a `QueryFilters` object for route-based cache invalidation.

## Signature

```ts
utils.path.to.route.pathFilter(filters?)
```

## Returns

Returns a filter object for `invalidateQueries`, `cancelQueries`, etc.

```tsx
const utils = useTreatyUtils()
const queryClient = useQueryClient()

// Invalidate all queries under /api/users
queryClient.invalidateQueries(utils.api.users.pathFilter())

// Invalidate specific user queries
queryClient.invalidateQueries(utils.api.users({ id: '1' }).pathFilter())

// Cancel queries
queryClient.cancelQueries(utils.api.users.pathFilter())
```

Use `useTreatyUtils()` when you want to invalidate/cancel by a route *group* (a non-endpoint node). If the node is an endpoint, you can also call `pathFilter()` on `useTreaty()` directly.

## Example

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTreaty, useTreatyUtils } from './lib/treaty'

function CreateUserForm() {
  const treaty = useTreaty()
  const utils = useTreatyUtils()
  const queryClient = useQueryClient()

  const createUser = useMutation(
    treaty.api.users.mutationOptions({
      onSuccess() {
        // Invalidate all user-related queries
        queryClient.invalidateQueries(utils.api.users.pathFilter())
      }
    })
  )

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      createUser.mutate({ name: 'Alice' })
    }}>
      <button>Create User</button>
    </form>
  )
}
```

## Optimistic Updates Example

```tsx
function UpdateUser({ userId }: { userId: string }) {
  const treaty = useTreaty()
  const utils = useTreatyUtils()
  const queryClient = useQueryClient()

  const updateUser = useMutation(
    treaty.api.users({ id: userId }).mutationOptions({
      async onMutate(newData) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(utils.api.users.pathFilter())

        // Snapshot the previous value
        const previousUsers = queryClient.getQueryData(
          treaty.api.users.queryKey()
        )

        // Optimistically update
        queryClient.setQueryData(
          treaty.api.users.queryKey(),
          (old) => old?.map(u =>
            u.id === userId ? { ...u, ...newData } : u
          )
        )

        return { previousUsers }
      },

      onError(err, vars, context) {
        // Rollback on error
        queryClient.setQueryData(
          treaty.api.users.queryKey(),
          context?.previousUsers
        )
      },

      onSettled() {
        // Always refetch after mutation
        queryClient.invalidateQueries(utils.api.users.pathFilter())
      }
    })
  )

  return (
    <button onClick={() => updateUser.mutate({ name: 'Updated' })}>
      Update
    </button>
  )
}
```
