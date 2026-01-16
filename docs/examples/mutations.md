# Mutations

Examples of creating, updating, and deleting data.

## Create

```tsx
function CreateUserForm() {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  const createUser = useMutation(
    treaty.api.users.mutationOptions({
      onSuccess(data) {
        // Invalidate list to refetch
        queryClient.invalidateQueries(treaty.api.users.pathFilter())
        toast.success(`Created: ${data.name}`)
      },
      onError(error) {
        toast.error(error.message)
      }
    })
  )

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      createUser.mutate({
        name: formData.get('name'),
        email: formData.get('email')
      })
    }}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

## Update

```tsx
function EditUserForm({ userId }: { userId: string }) {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  const { data: user } = useQuery(
    treaty.api.users({ id: userId }).queryOptions()
  )

  const updateUser = useMutation(
    treaty.api.users({ id: userId }).mutationOptions({
      onSuccess() {
        queryClient.invalidateQueries(
          treaty.api.users({ id: userId }).pathFilter()
        )
      }
    })
  )

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      updateUser.mutate({
        name: formData.get('name')
      })
    }}>
      <input name="name" defaultValue={user?.name} />
      <button disabled={updateUser.isPending}>Save</button>
    </form>
  )
}
```

## Delete

```tsx
function DeleteUserButton({ userId }: { userId: string }) {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  const deleteUser = useMutation(
    treaty.api.users({ id: userId }).mutationOptions('delete', {
      onSuccess() {
        // Remove from cache
        queryClient.removeQueries({
          queryKey: treaty.api.users({ id: userId }).queryKey()
        })
        // Refetch list
        queryClient.invalidateQueries(treaty.api.users.pathFilter())
      }
    })
  )

  return (
    <button
      onClick={() => {
        if (confirm('Delete this user?')) {
          deleteUser.mutate(undefined)
        }
      }}
      disabled={deleteUser.isPending}
    >
      {deleteUser.isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

## Optimistic Update

```tsx
function ToggleStatus({ taskId }: { taskId: string }) {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  const toggleStatus = useMutation(
    treaty.api.tasks({ id: taskId }).mutationOptions({
      async onMutate(newStatus) {
        // Cancel outgoing fetches
        await queryClient.cancelQueries(treaty.api.tasks.pathFilter())

        // Snapshot current state
        const previous = queryClient.getQueryData(treaty.api.tasks.queryKey())

        // Optimistically update
        queryClient.setQueryData(treaty.api.tasks.queryKey(), (old) =>
          old?.map(t => t.id === taskId ? { ...t, ...newStatus } : t)
        )

        return { previous }
      },

      onError(err, vars, context) {
        // Rollback on error
        queryClient.setQueryData(treaty.api.tasks.queryKey(), context?.previous)
        toast.error('Failed to update')
      },

      onSettled() {
        // Refetch to ensure sync
        queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
      }
    })
  )

  return (
    <button onClick={() => toggleStatus.mutate({ status: 'done' })}>
      Mark Complete
    </button>
  )
}
```
