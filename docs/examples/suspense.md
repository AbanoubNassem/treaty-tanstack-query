# With Suspense

Using React Suspense for data loading states.

## Basic Suspense

```tsx
import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTreaty } from './lib/treaty'

function UserList() {
  const treaty = useTreaty()

  // Data is guaranteed to be available
  const { data } = useSuspenseQuery(
    treaty.api.users.queryOptions()
  )

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UserList />
    </Suspense>
  )
}
```

## Multiple Suspense Boundaries

```tsx
function UserProfile({ userId }: { userId: string }) {
  const treaty = useTreaty()

  const { data: user } = useSuspenseQuery(
    treaty.api.users({ id: userId }).queryOptions()
  )

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}

function Dashboard() {
  return (
    <div>
      <Suspense fallback={<UserListSkeleton />}>
        <UserList />
      </Suspense>

      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfile userId="1" />
      </Suspense>
    </div>
  )
}
```

## With Error Boundary

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<Loading />}>
        <UserList />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Suspense Infinite Query

```tsx
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

function InfiniteList() {
  const treaty = useTreaty()

  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery(
    treaty.api.posts.infiniteQueryOptions(
      { query: { limit: 10 } },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      }
    )
  )

  return (
    <div>
      {data.pages.flatMap(page =>
        page.items.map(item => (
          <article key={item.id}>{item.title}</article>
        ))
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  )
}
```
