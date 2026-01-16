# queryOptions()

Generates TanStack Query options for GET requests.

## Signature

```ts
treaty.path.to.route.queryOptions(
  params?: EdenParams,
  options?: QueryOptions
): UseQueryOptions
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

### `options` (optional)

TanStack Query options to override:

```ts
{
  staleTime?: number
  gcTime?: number
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
  select?: (data: TData) => TSelected
  // ... all UseQueryOptions
}
```

## Returns

A `UseQueryOptions` object compatible with `useQuery`, `useSuspenseQuery`, and `prefetchQuery`.

## Examples

### Basic

```tsx
const { data } = useQuery(treaty.api.users.queryOptions())
```

### With Query Parameters

```tsx
const { data } = useQuery(
  treaty.api.users.queryOptions({
    query: { role: 'admin', limit: 10 }
  })
)
```

### With Route Parameters

```tsx
const { data } = useQuery(
  treaty.api.users({ id: userId }).queryOptions()
)
```

### With TanStack Query Options

```tsx
const { data } = useQuery(
  treaty.api.users.queryOptions(undefined, {
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
    select: (data) => data.filter(u => u.active)
  })
)
```

### With Suspense

```tsx
const { data } = useSuspenseQuery(
  treaty.api.users.queryOptions()
)
```

### Prefetching

```tsx
await queryClient.prefetchQuery(
  treaty.api.users.queryOptions()
)
```
