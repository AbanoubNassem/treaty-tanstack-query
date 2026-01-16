# Why This Library?

## The Problem

When using Eden Treaty with TanStack Query, you typically write code like this:

```tsx
// ❌ Manual approach - repetitive and error-prone
function Users() {
  const { data } = useQuery({
    queryKey: ['users'],           // Manual key - easy to typo
    queryFn: () => api.users.get() // Manual fn - no connection to key
  })

  const { data: user } = useQuery({
    queryKey: ['users', userId],   // Is this the right format?
    queryFn: () => api.users({ id: userId }).get()
  })
}
```

**Problems with this approach:**

1. **No type safety for query keys** - Typos like `['user']` instead of `['users']` cause bugs
2. **Keys and functions are disconnected** - Easy to mismatch them
3. **Inconsistent key formats** - Different developers use different patterns
4. **Difficult cache invalidation** - Hard to invalidate related queries

## The Solution

Treaty TanStack Query generates everything automatically:

```tsx
// ✅ With treaty-tanstack-react-query
function Users() {
  const treaty = useTreaty()

  // Query key is automatically generated and consistent
  const { data } = useQuery(treaty.api.users.queryOptions())

  // Route params are type-safe
  const { data: user } = useQuery(
    treaty.api.users({ id: userId }).queryOptions()
  )
}
```

## Benefits

### 1. Full Type Safety

The query options are derived from your Elysia routes:

```tsx
// TypeScript knows the exact shape of the response
const { data } = useQuery(treaty.api.users.queryOptions())
//      ^? { id: number; name: string }[]

// Type error if route doesn't exist
treaty.api.nonexistent.queryOptions() // ❌ TypeScript error
```

### 2. Consistent Query Keys

Keys are generated with a predictable structure:

```ts
// Access the query key directly
treaty.api.users.queryKey()
// → ['api', 'users', 'get']

treaty.api.users({ id: '1' }).queryKey()
// → ['api', 'users', { id: '1' }, 'get']
```

### 3. Easy Cache Invalidation

Use `pathFilter()` to invalidate by route hierarchy:

```tsx
const treaty = useTreaty()
const queryClient = useQueryClient()

// Invalidate all queries under /api/users
queryClient.invalidateQueries(treaty.api.users.pathFilter())

// Invalidate specific user
queryClient.invalidateQueries(treaty.api.users({ id: '1' }).pathFilter())
```

### 4. Standard TanStack Query Objects

Returns standard `queryOptions()` objects - works with all TanStack Query features:

```tsx
const treaty = useTreaty()

// Prefetching
await queryClient.prefetchQuery(treaty.api.users.queryOptions())

// Suspense
const { data } = useSuspenseQuery(treaty.api.users.queryOptions())

// Infinite queries
const { data } = useInfiniteQuery(
  treaty.api.posts.infiniteQueryOptions(
    { query: { limit: 10 } },
    {
      initialCursor: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  )
)
```

## Comparison

| Feature | Manual | treaty-tanstack-react-query |
|---------|--------|----------------------------|
| Type-safe responses | ⚠️ Manual | ✅ Automatic |
| Type-safe query keys | ❌ No | ✅ Yes |
| Consistent key format | ⚠️ Discipline | ✅ Enforced |
| Cache invalidation | ⚠️ Error-prone | ✅ pathFilter() |
| Refactoring safety | ❌ Dangerous | ✅ Compiler-checked |
