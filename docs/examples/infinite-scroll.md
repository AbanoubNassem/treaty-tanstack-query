# Infinite Scroll

Implementing infinite scroll with automatic loading.

## Basic Implementation

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'
import { useTreaty } from './lib/treaty'

function InfiniteList() {
  const treaty = useTreaty()
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery(
    treaty.api.posts.infiniteQueryOptions(
      { query: { limit: 20 } },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      }
    )
  )

  // Flatten all pages into single array
  const allPosts = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data]
  )

  // Auto-fetch when sentinel is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {allPosts.map(post => (
        <article key={post.id} className="post-card">
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}

      {/* Sentinel element */}
      <div ref={ref} className="sentinel">
        {isFetchingNextPage && <Spinner />}
        {!hasNextPage && allPosts.length > 0 && (
          <p>You've reached the end!</p>
        )}
      </div>
    </div>
  )
}
```

## With Filters

```tsx
function FilteredInfiniteList() {
  const treaty = useTreaty()
  const { ref, inView } = useInView()
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery(
    treaty.api.posts.infiniteQueryOptions(
      {
        query: {
          category: category !== 'all' ? category : undefined,
          sortBy,
          limit: 20
        }
      },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      }
    )
  )

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const allPosts = data?.pages.flatMap(p => p.items) ?? []

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All</option>
          <option value="tech">Tech</option>
          <option value="design">Design</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      {/* Posts */}
      {allPosts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}

      <div ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  )
}
```

## Virtualized Infinite Scroll

For large lists, combine with virtualization:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedInfiniteList() {
  const treaty = useTreaty()
  const parentRef = useRef(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      treaty.api.items.infiniteQueryOptions(
        { query: { limit: 50 } },
        {
          initialCursor: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor
        }
      )
    )

  const allItems = data?.pages.flatMap(p => p.items) ?? []

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Fetch more when near bottom
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    if (
      lastItem.index >= allItems.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [virtualItems, allItems.length, hasNextPage, isFetchingNextPage])

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const item = allItems[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              {item ? item.title : 'Loading...'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```
