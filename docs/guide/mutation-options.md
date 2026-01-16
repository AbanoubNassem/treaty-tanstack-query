# Mutation Options

`mutationOptions()` generates TanStack Query mutation options from your Eden Treaty routes.

## Basic Usage

```tsx
import { useMutation } from '@tanstack/react-query'
import { useTreaty } from './lib/treaty'

function CreateUser() {
  const treaty = useTreaty()

  const createUser = useMutation(
    treaty.api.users.mutationOptions()
  )

  const handleSubmit = (name: string) => {
    createUser.mutate({ name })
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(e.target.name.value)
    }}>
      <input name="name" placeholder="Name" />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

## HTTP Methods

By default, `mutationOptions()` uses POST. For other methods, pass the method name:

```tsx
const treaty = useTreaty()

// POST (default)
const createUser = useMutation(
  treaty.api.users.mutationOptions()
)

// PUT
const updateUser = useMutation(
  treaty.api.users({ id: userId }).mutationOptions('put')
)

// PATCH
const patchUser = useMutation(
  treaty.api.users({ id: userId }).mutationOptions('patch')
)

// DELETE
const deleteUser = useMutation(
  treaty.api.users({ id: userId }).mutationOptions('delete')
)
```

## With Cache Invalidation

Use `pathFilter()` for cache invalidation:

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

const createUser = useMutation(
  treaty.api.users.mutationOptions({
    onSuccess() {
      // Invalidate all queries under /api/users
      queryClient.invalidateQueries(treaty.api.users.pathFilter())
    }
  })
)
```

## Optimistic Updates

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

const updateTask = useMutation(
  treaty.api.tasks({ id: taskId }).mutationOptions({
    async onMutate(variables) {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(treaty.api.tasks.pathFilter())

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(
        treaty.api.tasks.queryKey()
      )

      // Optimistically update
      queryClient.setQueryData(
        treaty.api.tasks.queryKey(),
        (old: Task[] | undefined) =>
          old?.map(t => t.id === taskId ? { ...t, ...variables } : t)
      )

      return { previousTasks }
    },

    onError(err, variables, context) {
      // Rollback on error
      queryClient.setQueryData(
        treaty.api.tasks.queryKey(),
        context?.previousTasks
      )
    },

    onSettled() {
      // Refetch after mutation
      queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
    }
  })
)
```

## Mutation Variables

The mutation variables are fully typed based on your Elysia route:

```tsx
// Server route with body schema
app.post('/api/users', ({ body }) => ({ id: 1, ...body }), {
  body: t.Object({
    name: t.String(),
    email: t.String()
  })
})

// Client - TypeScript enforces the shape
const createUser = useMutation(treaty.api.users.mutationOptions())

// ✅ Correct
createUser.mutate({ name: 'Alice', email: 'alice@example.com' })

// ❌ TypeScript error - missing email
createUser.mutate({ name: 'Alice' })
```

## Overriding Options

Pass callbacks and options:

```tsx
const createUser = useMutation(
  treaty.api.users.mutationOptions({
    onSuccess(data) {
      toast.success(`Created user: ${data.name}`)
      navigate(`/users/${data.id}`)
    },

    onError(error) {
      toast.error(`Failed: ${error.message}`)
    },

    retry: 3,
    retryDelay: 1000
  })
)
```

## Delete with Confirmation

```tsx
function DeleteButton({ taskId }: { taskId: string }) {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  const deleteTask = useMutation(
    treaty.api.tasks({ id: taskId }).mutationOptions('delete', {
      onSuccess() {
        queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
        toast.success('Task deleted')
      }
    })
  )

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      deleteTask.mutate(undefined)
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleteTask.isPending}>
      {deleteTask.isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```
