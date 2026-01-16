import { Elysia, t } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { openapi, fromTypes } from '@elysiajs/openapi'

// ============================================================================
// In-Memory Database (simulating a real database)
// ============================================================================

type Task = {
	id: number
	title: string
	description: string
	status: 'todo' | 'in-progress' | 'done'
	priority: 'low' | 'medium' | 'high'
	createdAt: Date
	updatedAt: Date
}

type User = {
	id: number
	name: string
	email: string
	avatar: string
}

// Mock data
let taskIdCounter = 1
const tasks: Task[] = [
	{
		id: taskIdCounter++,
		title: 'Design landing page',
		description:
			'Create a modern landing page with hero section and features',
		status: 'in-progress',
		priority: 'high',
		createdAt: new Date('2024-01-15'),
		updatedAt: new Date('2024-01-16')
	},
	{
		id: taskIdCounter++,
		title: 'Setup CI/CD pipeline',
		description:
			'Configure GitHub Actions for automated testing and deployment',
		status: 'todo',
		priority: 'medium',
		createdAt: new Date('2024-01-16'),
		updatedAt: new Date('2024-01-16')
	},
	{
		id: taskIdCounter++,
		title: 'Write API documentation',
		description: 'Document all API endpoints with examples',
		status: 'done',
		priority: 'low',
		createdAt: new Date('2024-01-14'),
		updatedAt: new Date('2024-01-15')
	}
]

const currentUser: User = {
	id: 1,
	name: 'Alex Developer',
	email: 'alex@example.com',
	avatar: '👨‍💻'
}

// WebSocket subscribers for real-time updates
const wsSubscribers = new Set<any>()

// Helper to broadcast task updates
function broadcastTaskUpdate(task: Task) {
	for (const ws of wsSubscribers) {
		ws.send(JSON.stringify({ type: 'task-updated', task }))
	}
}

// ============================================================================
// Elysia Server with Comprehensive API
// ============================================================================

export const app = new Elysia()
	.use(
		openapi({
			references: fromTypes()
		})
	)
	.use(
		await staticPlugin({
			prefix: '/'
		})
	)

	// ========================================================================
	// Authentication / User Routes
	// ========================================================================

	.get('/api/user/me', () => currentUser)
	.get('/api/users', () => [currentUser])

	// ========================================================================
	// Task Routes (CRUD + Filters)
	// ========================================================================

	// Get all tasks with optional filtering
	.get(
		'/api/tasks',
		({ query: { status, priority, search } }) => {
			let filtered = [...tasks]

			if (status) {
				filtered = filtered.filter((t) => t.status === status)
			}

			if (priority) {
				filtered = filtered.filter((t) => t.priority === priority)
			}

			if (search) {
				const searchLower = search.toLowerCase()
				filtered = filtered.filter(
					(t) =>
						t.title.toLowerCase().includes(searchLower) ||
						t.description.toLowerCase().includes(searchLower)
				)
			}

			// Sort by updatedAt descending
			return filtered.sort(
				(a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
			)
		},
		{
			query: t.Object({
				status: t.Optional(
					t.Union([
						t.Literal('todo'),
						t.Literal('in-progress'),
						t.Literal('done')
					])
				),
				priority: t.Optional(
					t.Union([
						t.Literal('low'),
						t.Literal('medium'),
						t.Literal('high')
					])
				),
				search: t.Optional(t.String())
			})
		}
	)

	// Get task by ID
	.get(
		'/api/tasks/:id',
		({ params: { id } }) => {
			const task = tasks.find((t) => t.id === id)
			if (!task) {
				throw new Error('Task not found')
			}
			return task
		},
		{
			params: t.Object({
				id: t.Number()
			})
		}
	)

	// Infinite scroll for tasks
	.get(
		'/api/tasks/infinite',
		({ query: { cursor = 0, limit = 10, status } }) => {
			let filtered = status
				? tasks.filter((t) => t.status === status)
				: [...tasks]

			filtered.sort(
				(a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
			)

			const items = filtered.slice(cursor, cursor + limit)
			const nextCursor =
				cursor + limit < filtered.length ? cursor + limit : null

			return {
				items,
				nextCursor,
				total: filtered.length
			}
		},
		{
			query: t.Object({
				cursor: t.Optional(t.Number()),
				limit: t.Optional(t.Number()),
				status: t.Optional(
					t.Union([
						t.Literal('todo'),
						t.Literal('in-progress'),
						t.Literal('done')
					])
				)
			})
		}
	)

	// Create task
	.post(
		'/api/tasks',
		({ body }) => {
			const newTask: Task = {
				id: taskIdCounter++,
				title: body.title,
				description: body.description,
				status: body.status || 'todo',
				priority: body.priority || 'medium',
				createdAt: new Date(),
				updatedAt: new Date()
			}
			tasks.unshift(newTask)
			broadcastTaskUpdate(newTask)
			return newTask
		},
		{
			body: t.Object({
				title: t.String({ minLength: 1, maxLength: 200 }),
				description: t.String({ maxLength: 1000 }),
				status: t.Optional(
					t.Union([
						t.Literal('todo'),
						t.Literal('in-progress'),
						t.Literal('done')
					])
				),
				priority: t.Optional(
					t.Union([
						t.Literal('low'),
						t.Literal('medium'),
						t.Literal('high')
					])
				)
			})
		}
	)

	// Update task
	.patch(
		'/api/tasks/:id',
		({ params: { id }, body }) => {
			const index = tasks.findIndex((t) => t.id === id)
			if (index === -1) {
				throw new Error('Task not found')
			}

			const updated: Task = {
				...tasks[index],
				...body,
				updatedAt: new Date()
			}
			tasks[index] = updated
			broadcastTaskUpdate(updated)
			return updated
		},
		{
			params: t.Object({
				id: t.Number()
			}),
			body: t.Object({
				title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
				description: t.Optional(t.String({ maxLength: 1000 })),
				status: t.Optional(
					t.Union([
						t.Literal('todo'),
						t.Literal('in-progress'),
						t.Literal('done')
					])
				),
				priority: t.Optional(
					t.Union([
						t.Literal('low'),
						t.Literal('medium'),
						t.Literal('high')
					])
				)
			})
		}
	)

	// Delete task
	.delete(
		'/api/tasks/:id',
		({ params: { id } }) => {
			const index = tasks.findIndex((t) => t.id === id)
			if (index === -1) {
				throw new Error('Task not found')
			}

			const deleted = tasks.splice(index, 1)[0]
			broadcastTaskUpdate(deleted!)
			return { success: true, id }
		},
		{
			params: t.Object({
				id: t.Number()
			})
		}
	)

	// ========================================================================
	// Statistics / Analytics
	// ========================================================================

	.get('/api/stats', () => {
		return {
			total: tasks.length,
			byStatus: {
				todo: tasks.filter((t) => t.status === 'todo').length,
				'in-progress': tasks.filter((t) => t.status === 'in-progress')
					.length,
				done: tasks.filter((t) => t.status === 'done').length
			},
			byPriority: {
				low: tasks.filter((t) => t.priority === 'low').length,
				medium: tasks.filter((t) => t.priority === 'medium').length,
				high: tasks.filter((t) => t.priority === 'high').length
			}
		}
	})

	// ========================================================================
	// WebSocket for Real-time Updates
	// ========================================================================

	.ws('/ws/tasks', {
		body: t.Any(),
		response: t.Any(),
		open(ws) {
			wsSubscribers.add(ws)
			ws.send(
				JSON.stringify({
					type: 'connected',
					message: 'Real-time updates enabled'
				})
			)
		},
		close(ws) {
			wsSubscribers.delete(ws)
		},
		message(ws, message) {
			// Echo for testing
			if (typeof message === 'string' && message.startsWith('ping')) {
				ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
			}
		}
	})

app.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
