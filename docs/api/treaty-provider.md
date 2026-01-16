# TreatyProvider

React context provider for treaty-tanstack-react-query.

## Creation

```ts
import { createTreatyContext } from 'treaty-tanstack-react-query'

const { TreatyProvider, useTreaty } =
  createTreatyContext<typeof client>()
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `client` | `Treaty<T>` | Yes | Eden Treaty client instance |
| `queryClient` | `QueryClient` | Yes | TanStack Query client |
| `children` | `ReactNode` | Yes | Child components |

## Usage

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { treaty } from '@elysiajs/eden'
import { createTreatyContext } from 'treaty-tanstack-react-query'
import type { App } from './server'

const client = treaty<App>('http://localhost:3000')
const queryClient = new QueryClient()

const { TreatyProvider, useTreaty } =
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

## Related

- [useTreaty](/api/use-treaty) - Access query/mutation options
- [pathFilter](/api/use-treaty-utils) - Cache invalidation by route
