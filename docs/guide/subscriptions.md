# Subscriptions (WebSocket)

Treaty TanStack Query provides a `useSubscription` hook for real-time WebSocket connections.

## Basic Usage

```tsx
import { useSubscription } from 'treaty-tanstack-react-query'
import { useTreaty } from './lib/treaty'

function RealtimeStatus() {
  const treaty = useTreaty()

  const ws = useSubscription(
    treaty.ws.tasks.subscriptionOptions(undefined, {
      enabled: true,
      onData(data) {
        console.log('Received:', data)
      }
    })
  )

  const statusConfig = {
    connecting: { icon: '🔄', text: 'Connecting...' },
    pending: { icon: '✅', text: 'Connected' },
    error: { icon: '❌', text: 'Disconnected' },
    idle: { icon: '⏸️', text: 'Idle' }
  }

  const config = statusConfig[ws.status]

  return (
    <div>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  )
}
```

## Server Setup (Elysia)

```ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .ws('/ws/tasks', {
    body: t.Object({
      type: t.String()
    }),
    response: t.Object({
      type: t.String(),
      task: t.Optional(t.Object({
        id: t.String(),
        title: t.String()
      }))
    }),
    message(ws, message) {
      if (message.type === 'subscribe') {
        // Start sending updates
        const interval = setInterval(() => {
          ws.send({
            type: 'task-updated',
            task: { id: '1', title: 'Updated task' }
          })
        }, 5000)

        ws.data.interval = interval
      }
    },
    close(ws) {
      clearInterval(ws.data.interval)
    }
  })
```

## subscriptionOptions API

```tsx
treaty.ws.events.subscriptionOptions(
  // First arg: Eden params (optional)
  undefined,

  // Second arg: Subscription options
  {
    enabled: true,
    onData(data) {
      // Handle incoming data
      console.log('Received:', data)

      // Trigger cache updates
      queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
    }
  }
)
```

## Subscription States

The `status` field indicates the connection state:

| Status | Description |
|--------|-------------|
| `idle` | Not connected yet |
| `connecting` | Establishing connection |
| `pending` | Connected and ready |
| `error` | Connection failed |

## Real-time Cache Updates

Combine subscriptions with cache invalidation:

```tsx
function RealtimeTaskList() {
  const treaty = useTreaty()
  const queryClient = useQueryClient()

  // Subscribe to real-time updates
  useSubscription(
    treaty.ws.tasks.subscriptionOptions(undefined, {
      enabled: true,
      onData(data) {
        // Auto-refresh when tasks change
        if (data?.type === 'task-updated') {
          queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
        }
      }
    })
  )

  // Regular query that gets invalidated by subscription
  const { data: tasks } = useQuery(
    treaty.api.tasks.queryOptions()
  )

  return (
    <ul>
      {tasks?.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

## With Route Parameters

```tsx
// Route: WS /ws/rooms/:roomId
function RoomEvents({ roomId }: { roomId: string }) {
  const treaty = useTreaty()

  const ws = useSubscription(
    treaty.ws.rooms({ roomId }).subscriptionOptions(undefined, {
      enabled: true,
      onData(data) {
        console.log(`Room ${roomId} event:`, data)
      }
    })
  )

  return <div>Status: {ws.status}</div>
}
```

## Conditional Subscription

```tsx
function ConditionalRealtime({ enabled }: { enabled: boolean }) {
  const treaty = useTreaty()

  const ws = useSubscription(
    treaty.ws.events.subscriptionOptions(undefined, {
      enabled, // Only connect when enabled
      onData(data) {
        console.log('Event:', data)
      }
    })
  )

  return (
    <div>
      {enabled ? `Status: ${ws.status}` : 'Realtime disabled'}
    </div>
  )
}
```

## Cleanup

The subscription automatically closes when the component unmounts or when `enabled` becomes `false`.
