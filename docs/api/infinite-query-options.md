# infiniteQueryOptions()

Generates TanStack Query options for infinite/paginated queries.

## Signature

```ts
treaty.path.to.route.infiniteQueryOptions(
  params?: EdenParams,
  options: InfiniteQueryOptions
): UseInfiniteQueryOptions
```

## Parameters

### `params` (optional)

Eden Treaty request parameters:

```ts
{
  query?: Record<string, unknown>  // Query string parameters
  headers?: Record<string, string> // HTTP headers
}
```

### `options` (required)

TanStack Query infinite options:

```ts
{
  initialCursor: TPageParam          // Required: starting cursor
  getNextPageParam: (lastPage) => TPageParam | undefined  // Required
  getPreviousPageParam?: (firstPage) => TPageParam | undefined
  maxPages?: number
  // ... all UseInfiniteQueryOptions
}
```

## Returns

A `UseInfiniteQueryOptions` object compatible with `useInfiniteQuery` and `useSuspenseInfiniteQuery`.

## Examples

### Basic

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  treaty.api.posts.infiniteQueryOptions(
    { query: { limit: 10 } },
    {
      initialCursor: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  )
)
```

### With Filters

```tsx
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

### Bi-directional

```tsx
const { data, fetchNextPage, fetchPreviousPage } = useInfiniteQuery(
  treaty.api.messages.infiniteQueryOptions(
    {},
    {
      initialCursor: { before: null, after: null },
      getNextPageParam: (page) => page.hasMore ? { after: page.lastId } : undefined,
      getPreviousPageParam: (page) => page.hasPrev ? { before: page.firstId } : undefined,
      maxPages: 5
    }
  )
)
```

### With Suspense

```tsx
const { data } = useSuspenseInfiniteQuery(
  treaty.api.posts.infiniteQueryOptions(
    { query: { limit: 10 } },
    {
      initialCursor: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  )
)
```
