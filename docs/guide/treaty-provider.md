# Treaty Provider

The `TreatyProvider` component provides your Eden Treaty client to all child components via React Context.

## Basic Setup

```tsx
import { treaty } from '@elysiajs/eden'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTreatyContext } from 'treaty-tanstack-react-query'
import type { App } from './server'

// Create the treaty client
const client = treaty<App>('http://localhost:3000')
const queryClient = new QueryClient()

// Create the context - this gives you TreatyProvider, useTreaty, and useTreatyClient
const { TreatyProvider, useTreaty, useTreatyClient } =
  createTreatyContext<typeof client>()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TreatyProvider client={client} queryClient={queryClient}>
        <YourApp />
      </TreatyProvider>
    </QueryClientProvider>
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `client` | `Treaty<T>` | Yes | Your Eden Treaty client instance |
| `queryClient` | `QueryClient` | Yes | TanStack Query client instance |
| `children` | `ReactNode` | Yes | Child components |
| `keyPrefix` | `string` | No | Prefix for all query keys (useful for multiple APIs) |
| `overrides` | `{ mutations?: ... }` | No | Global mutation option overrides |

## The Context Hooks

`createTreatyContext` returns:

### `TreatyProvider`

The provider component that wraps your app.

### `useTreaty()`

Returns a proxy for creating query/mutation options:

```tsx
const treaty = useTreaty()

// Query options
treaty.api.users.queryOptions()
treaty.api.users({ id: '1' }).queryOptions()

// Mutation options
treaty.api.users.mutationOptions()
treaty.api.users({ id: '1' }).mutationOptions()
treaty.api.users({ id: '1' }).mutationOptions('delete') // specific method

// Infinite query options
treaty.api.posts.infiniteQueryOptions({ query: { limit: 10 } }, {
  initialCursor: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor
})

// Query keys
treaty.api.users.queryKey()

// Cache invalidation (hierarchical)
treaty.api.users.pathFilter()

// Subscription options (WebSocket)
treaty.ws.events.subscriptionOptions()
```

### `useTreatyClient()`

Returns the raw Eden Treaty client:

```tsx
const client = useTreatyClient()

// Direct API calls (bypassing TanStack Query)
const response = await client.api.users.get()
```

## Multiple APIs with Key Prefixing

For multiple APIs, create separate contexts and use `keyPrefix` to namespace query keys:

```tsx
import { treaty } from '@elysiajs/eden'
import { createTreatyContext } from 'treaty-tanstack-react-query'

// Billing API
const billingClient = treaty<BillingApp>('http://billing.example.com')
const {
  TreatyProvider: BillingProvider,
  useTreaty: useBilling
} = createTreatyContext<typeof billingClient, { keyPrefix: true }>()

// Account API
const accountClient = treaty<AccountApp>('http://account.example.com')
const {
  TreatyProvider: AccountProvider,
  useTreaty: useAccount
} = createTreatyContext<typeof accountClient, { keyPrefix: true }>()

// Nest the providers with keyPrefix to avoid query key collisions
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BillingProvider client={billingClient} queryClient={queryClient} keyPrefix="billing">
        <AccountProvider client={accountClient} queryClient={queryClient} keyPrefix="account">
          <YourApp />
        </AccountProvider>
      </BillingProvider>
    </QueryClientProvider>
  )
}
```

Then use the specific hooks:

```tsx
function Dashboard() {
  const billing = useBilling()
  const account = useAccount()

  // Query keys are namespaced: ["billing", "invoices", ...] and ["account", "users", ...]
  const { data: invoices } = useQuery(billing.invoices.queryOptions())
  const { data: users } = useQuery(account.users.queryOptions())

  return (
    <div>
      <h2>Invoices: {invoices?.length}</h2>
      <h2>Users: {users?.length}</h2>
    </div>
  )
}
```

::: tip Why keyPrefix?
When using multiple APIs that might have overlapping route names (like `/users`), `keyPrefix` ensures their query keys don't collide in the cache. Without it, both APIs would share the same query key structure.
:::

## Without Provider (Direct Usage)

You can use `createTreatyOptionsProxy` directly without a provider:

```tsx
import { treaty } from '@elysiajs/eden'
import { createTreatyOptionsProxy } from 'treaty-tanstack-react-query'
import type { App } from './server'

const client = treaty<App>('http://localhost:3000')

// Note: takes an options object, not separate arguments
const treatyOptions = createTreatyOptionsProxy({
  client,
  queryClient
})

// Use directly
function Users() {
  const { data } = useQuery(treatyOptions.api.users.queryOptions())
  // ...
}
```

This is useful for:
- Server-side rendering without React context
- Using in non-React code (data loaders, etc.)
- Simpler setups with a single API
