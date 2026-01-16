# Infinite Queries

Treaty TanStack Query supports infinite queries for paginated data, with full type safety.

## Basic Usage

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTreaty } from './lib/treaty'

function Posts() {
  const treaty = useTreaty()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery(
    treaty.api.tasks.infinite.infiniteQueryOptions(
      { query: { limit: 10 } },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      }
    )
  )

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.items.map(item => (
            <article key={item.id}>{item.title}</article>
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
            ? 'Load More'
            : 'No more items'}
      </button>
    </div>
  )
}
```

## Server Setup

Your Elysia route should accept pagination parameters and return a cursor:

```ts
// server.ts
app.get('/api/tasks/infinite', ({ query }) => {
  const cursor = query.cursor ?? 0
  const limit = query.limit ?? 10

  const items = getTasks({ cursor, limit })
  const nextCursor = items.length === limit ? cursor + limit : undefined

  return {
    items,
    nextCursor
  }
}, {
  query: t.Object({
    cursor: t.Optional(t.Number()),
    limit: t.Optional(t.Number())
  })
})
```

## infiniteQueryOptions API

```tsx
treaty.api.posts.infiniteQueryOptions(
  // First arg: Eden params (query, headers, etc.)
  { query: { category: 'tech' } },

  // Second arg: TanStack Query infinite options
  {
    initialCursor: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor, // optional
  }
)
```

## With Query Parameters

Combine pagination with filters:

```tsx
const treaty = useTreaty()

const { data } = useInfiniteQuery(
  treaty.api.tasks.infinite.infiniteQueryOptions(
    {
      query: {
        status: 'active',
        priority: 'high',
        limit: 20
      }
    },
    {
      initialCursor: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  )
)
```

## Suspense Mode

```tsx
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

function Posts() {
  const treaty = useTreaty()

  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery(
    treaty.api.tasks.infinite.infiniteQueryOptions(
      { query: { limit: 10 } },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      }
    )
  )

  // data is never undefined with suspense
  return (
    <div>
      {data.pages.flatMap(page =>
        page.items.map(item => (
          <article key={item.id}>{item.title}</article>
        ))
      )}
    </div>
  )
}
```

## Infinite Scroll Implementation

```tsx
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'

function InfiniteTaskList() {
  const treaty = useTreaty()
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery(
    treaty.api.tasks.infinite.infiniteQueryOptions(
      { query: { limit: 10 } },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      }
    )
  )

  // Flatten pages into single array
  const allItems = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data]
  )

  // Fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {allItems.map(item => (
        <article key={item.id}>{item.title}</article>
      ))}

      {/* Sentinel element */}
      <div ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>

      {!hasNextPage && allItems.length > 0 && (
        <div>All items loaded</div>
      )}
    </div>
  )
}
```

## Bi-directional Infinite Query

For chat-like interfaces where you can scroll both ways:

```tsx
const { data, fetchNextPage, fetchPreviousPage } = useInfiniteQuery(
  treaty.api.messages.infiniteQueryOptions(
    {},
    {
      initialCursor: { before: null, after: null },

      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? { after: lastPage.lastId } : undefined,

      getPreviousPageParam: (firstPage) =>
        firstPage.hasPrevious ? { before: firstPage.firstId } : undefined,

      maxPages: 5 // Limit memory usage
    }
  )
)
```
