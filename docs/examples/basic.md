# Basic Usage

A simple example showing queries and mutations.

## Server

```ts
// server.ts
import { Elysia, t } from 'elysia'

const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' }
]

export const app = new Elysia()
  .get('/api/users', () => users)
  .get('/api/users/:id', ({ params }) =>
    users.find(u => u.id === params.id)
  )
  .post('/api/users', ({ body }) => {
    const user = { id: String(users.length + 1), ...body }
    users.push(user)
    return user
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String()
    })
  })
  .listen(3000)

export type App = typeof app
```

## Client Setup

```tsx
// lib/treaty.ts
import { treaty } from '@elysiajs/eden'
import { createTreatyContext } from 'treaty-tanstack-react-query'
import type { App } from '../server'

export const client = treaty<App>('http://localhost:3000')

export const { TreatyProvider, useTreaty } =
  createTreatyContext<typeof client>()
```

## App

```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreatyProvider, client } from './lib/treaty'
import { UserList } from './UserList'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        <UserList />
      </TreatyProvider>
    </QueryClientProvider>
  )
}
```

## Component

```tsx
// UserList.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTreaty } from './lib/treaty'
import { useState } from 'react'

export function UserList() {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Fetch users
  const { data: users, isLoading } = useQuery(
    treaty.api.users.queryOptions()
  )

  // Create user mutation
  const createUser = useMutation(
    treaty.api.users.mutationOptions({
      onSuccess() {
        queryClient.invalidateQueries(treaty.api.users.pathFilter())
        setName('')
        setEmail('')
      }
    })
  )

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Users</h1>

      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>

      <form onSubmit={(e) => {
        e.preventDefault()
        createUser.mutate({ name, email })
      }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? 'Creating...' : 'Add User'}
        </button>
      </form>
    </div>
  )
}
```
