/**
 * Task Management App - Comprehensive Demo of treaty-tanstack-react-query
 *
 * This app showcases ALL library features:
 * ✅ Queries with filters
 * ✅ Infinite queries with pagination
 * ✅ Mutations (create, update, delete)
 * ✅ Optimistic updates
 * ✅ Real-time subscriptions (WebSocket)
 * ✅ Query key management
 * ✅ Query invalidation strategies
 * ✅ Type-safe API integration
 */

import { treaty as createEdenTreaty } from '@elysiajs/eden'
import {
	QueryClient,
	QueryClientProvider,
	useQuery,
	useMutation,
	useQueryClient,
	useInfiniteQuery
} from '@tanstack/react-query'
import {
	createTreatyContext,
	useSubscription,
	type inferOutput,
	type inferInput
} from 'treaty-tanstack-react-query'
import type { app } from '../src/index'
import { useState, useMemo } from 'react'
import clsx from 'clsx'

// ============================================================================
// Setup Treaty + React Query Integration
// ============================================================================

const client = createEdenTreaty<typeof app>('localhost:3000')
const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: false, staleTime: 10000 },
		mutations: { retry: false }
	}
})

const { TreatyProvider, useTreaty } = createTreatyContext<typeof client>()

// ============================================================================
// Type Inference Helpers
// ============================================================================

type Task = inferOutput<
	ReturnType<typeof useTreaty>['api']['tasks']['queryOptions']
>[number]
type TaskStatus = Task['status']
type TaskPriority = Task['priority']
type CreateTaskInput = inferInput<
	ReturnType<typeof useTreaty>['api']['tasks']['mutationOptions']
>

// ============================================================================
// Components
// ============================================================================

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<TreatyProvider client={client} queryClient={queryClient}>
				<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
					<TaskManagementApp />
				</div>
			</TreatyProvider>
		</QueryClientProvider>
	)
}

function TaskManagementApp() {
	const [view, setView] = useState<'list' | 'infinite'>('list')

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			{/* Header */}
			<header className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-4xl font-bold text-slate-900 mb-2">
							Task Manager Pro
						</h1>
						<p className="text-slate-600">
							Powered by treaty-tanstack-react-query
						</p>
					</div>
					<UserProfile />
				</div>
			</header>

			{/* Stats Dashboard */}
			<StatsSection />

			{/* View Toggle */}
			<div className="flex gap-2 mb-6">
				<button
					onClick={() => setView('list')}
					className={clsx(
						'px-4 py-2 rounded-lg font-medium transition-colors',
						view === 'list'
							? 'bg-blue-600 text-white'
							: 'bg-white text-slate-700 hover:bg-slate-50'
					)}
				>
					List View (with Filters)
				</button>
				<button
					onClick={() => setView('infinite')}
					className={clsx(
						'px-4 py-2 rounded-lg font-medium transition-colors',
						view === 'infinite'
							? 'bg-blue-600 text-white'
							: 'bg-white text-slate-700 hover:bg-slate-50'
					)}
				>
					Infinite Scroll
				</button>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					{view === 'list' ? <TaskList /> : <TaskInfiniteList />}
				</div>
				<div>
					<CreateTaskForm />
					<RealtimeStatus />
				</div>
			</div>
		</div>
	)
}

// ============================================================================
// 1. User Profile (Simple Query)
// ============================================================================

function UserProfile() {
	const treaty = useTreaty()
	const { data: user } = useQuery(treaty.api.user.me.queryOptions())

	if (!user) return null

	return (
		<div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm">
			<div className="text-3xl">{user.avatar}</div>
			<div>
				<div className="font-semibold text-slate-900">{user.name}</div>
				<div className="text-sm text-slate-500">{user.email}</div>
			</div>
		</div>
	)
}

// ============================================================================
// 2. Stats (Query with Auto-refresh)
// ============================================================================

function StatsSection() {
	const treaty = useTreaty()
	const { data: stats } = useQuery(
		treaty.api.stats.queryOptions(undefined, {
			refetchInterval: 5000 // Auto-refresh every 5s
		})
	)

	if (!stats) return null

	const statCards = [
		{
			label: 'Total Tasks',
			value: stats.total,
			color: 'bg-blue-100 text-blue-700'
		},
		{
			label: 'To Do',
			value: stats.byStatus.todo,
			color: 'bg-gray-100 text-gray-700'
		},
		{
			label: 'In Progress',
			value: stats.byStatus['in-progress'],
			color: 'bg-yellow-100 text-yellow-700'
		},
		{
			label: 'Done',
			value: stats.byStatus.done,
			color: 'bg-green-100 text-green-700'
		}
	]

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			{statCards.map((stat) => (
				<div
					key={stat.label}
					className="bg-white rounded-lg shadow-sm p-5"
				>
					<div
						className={clsx(
							'inline-flex px-3 py-1 rounded-full text-sm font-semibold mb-2',
							stat.color
						)}
					>
						{stat.label}
					</div>
					<div className="text-3xl font-bold text-slate-900">
						{stat.value}
					</div>
				</div>
			))}
		</div>
	)
}

// ============================================================================
// 3. Task List (Query with Filters)
// ============================================================================

function TaskList() {
	const treaty = useTreaty()
	const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
	const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
	const [search, setSearch] = useState('')

	// Query with dynamic filters
	const { data: tasks, isLoading } = useQuery(
		treaty.api.tasks.queryOptions({
			query: {
				...(statusFilter && { status: statusFilter }),
				...(priorityFilter && { priority: priorityFilter }),
				...(search && { search })
			}
		})
	)

	return (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<h2 className="text-2xl font-bold text-slate-900 mb-4">Tasks</h2>

			{/* Filters */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
				<input
					type="text"
					placeholder="Search tasks..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<select
					value={statusFilter}
					onChange={(e) =>
						setStatusFilter(e.target.value as TaskStatus | '')
					}
					className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="">All Statuses</option>
					<option value="todo">To Do</option>
					<option value="in-progress">In Progress</option>
					<option value="done">Done</option>
				</select>
				<select
					value={priorityFilter}
					onChange={(e) =>
						setPriorityFilter(e.target.value as TaskPriority | '')
					}
					className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="">All Priorities</option>
					<option value="low">Low</option>
					<option value="medium">Medium</option>
					<option value="high">High</option>
				</select>
			</div>

			{/* Task List */}
			{isLoading ? (
				<div className="text-center py-12 text-slate-500">
					Loading tasks...
				</div>
			) : tasks?.length === 0 ? (
				<div className="text-center py-12 text-slate-500">
					No tasks found. Create one to get started!
				</div>
			) : (
				<div className="space-y-3">
					{tasks?.map((task) => (
						<TaskCard key={task.id} task={task} />
					))}
				</div>
			)}
		</div>
	)
}

// ============================================================================
// 4. Infinite Scroll List
// ============================================================================

function TaskInfiniteList() {
	const treaty = useTreaty()

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery(
			treaty.api.tasks.infinite.infiniteQueryOptions(
				{ query: { limit: 5 } },
				{
					initialCursor: 0,
					getNextPageParam: (lastPage) => lastPage.nextCursor
				}
			)
		)

	const allTasks = useMemo(
		() => data?.pages.flatMap((page) => page.items) ?? [],
		[data]
	)

	return (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<h2 className="text-2xl font-bold text-slate-900 mb-4">
				Infinite Scroll Tasks
			</h2>

			{isLoading ? (
				<div className="text-center py-12 text-slate-500">
					Loading...
				</div>
			) : (
				<>
					<div className="space-y-3 mb-4">
						{allTasks.map((task) => (
							<TaskCard key={task.id} task={task} />
						))}
					</div>

					{hasNextPage && (
						<button
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							className="w-full py-3 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-lg font-medium transition-colors"
						>
							{isFetchingNextPage
								? 'Loading more...'
								: 'Load More'}
						</button>
					)}

					{!hasNextPage && allTasks.length > 0 && (
						<div className="text-center py-4 text-slate-500">
							All tasks loaded
						</div>
					)}
				</>
			)}
		</div>
	)
}

// ============================================================================
// 5. Task Card (with Update & Delete Mutations + Optimistic Updates)
// ============================================================================

function TaskCard({ task }: { task: Task }) {
	const treaty = useTreaty()
	const queryClient = useQueryClient()

	// Update mutation with optimistic update
	const updateTask = useMutation(
		treaty.api.tasks({ id: task.id }).mutationOptions({
			async onMutate(variables) {
				// Cancel outgoing refetches
				await queryClient.cancelQueries(treaty.api.tasks.pathFilter())

				// Snapshot previous value
				const previousTasks = queryClient.getQueryData(
					treaty.api.tasks.queryKey()
				)

				// Optimistically update
				queryClient.setQueryData(
					treaty.api.tasks.queryKey(),
					(old: Task[] | undefined) =>
						old?.map((t) =>
							t.id === task.id ? { ...t, ...variables } : t
						)
				)

				return { previousTasks }
			},
			onError(err, variables, context) {
				// Rollback on error
				queryClient.setQueryData(
					treaty.api.tasks.queryKey(),
					context?.previousTasks
				)
			},
			onSettled() {
				// Refetch after mutation
				queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
				queryClient.invalidateQueries(treaty.api.stats.pathFilter())
			}
		})
	)

	// Delete mutation with optimistic update
	const deleteTask = useMutation(
		treaty.api.tasks({ id: task.id }).mutationOptions('delete', {
			async onMutate() {
				await queryClient.cancelQueries(treaty.api.tasks.pathFilter())

				const previousTasks = queryClient.getQueryData(
					treaty.api.tasks.queryKey()
				)

				// Optimistically remove
				queryClient.setQueryData(
					treaty.api.tasks.queryKey(),
					(old: Task[] | undefined) =>
						old?.filter((t) => t.id !== task.id)
				)

				return { previousTasks }
			},
			onError(err, variables, context) {
				queryClient.setQueryData(
					treaty.api.tasks.queryKey(),
					context?.previousTasks
				)
			},
			onSettled() {
				queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
				queryClient.invalidateQueries(treaty.api.stats.pathFilter())
			}
		})
	)

	const statusColors = {
		todo: 'bg-gray-100 text-gray-700',
		'in-progress': 'bg-yellow-100 text-yellow-700',
		done: 'bg-green-100 text-green-700'
	}

	const priorityColors = {
		low: 'bg-blue-100 text-blue-700',
		medium: 'bg-orange-100 text-orange-700',
		high: 'bg-red-100 text-red-700'
	}

	return (
		<div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between mb-2">
				<h3 className="font-semibold text-slate-900 flex-1">
					{task.title}
				</h3>
				<button
					onClick={() => deleteTask.mutate(undefined)}
					className="text-red-500 hover:text-red-700 ml-2"
				>
					🗑️
				</button>
			</div>

			<p className="text-slate-600 text-sm mb-3">{task.description}</p>

			<div className="flex items-center gap-2 mb-3">
				<span
					className={clsx(
						'px-2 py-1 rounded text-xs font-semibold',
						statusColors[task.status]
					)}
				>
					{task.status}
				</span>
				<span
					className={clsx(
						'px-2 py-1 rounded text-xs font-semibold',
						priorityColors[task.priority]
					)}
				>
					{task.priority}
				</span>
			</div>

			{/* Quick Status Update */}
			<div className="flex gap-2">
				{(['todo', 'in-progress', 'done'] as TaskStatus[]).map(
					(status) => (
						<button
							key={status}
							onClick={() => updateTask.mutate({ status })}
							disabled={task.status === status}
							className={clsx(
								'px-3 py-1 rounded text-xs font-medium transition-colors',
								task.status === status
									? 'bg-slate-200 text-slate-500 cursor-not-allowed'
									: 'bg-slate-100 hover:bg-slate-200 text-slate-700'
							)}
						>
							{status === 'in-progress' ? 'Progress' : status}
						</button>
					)
				)}
			</div>
		</div>
	)
}

// ============================================================================
// 6. Create Task Form (Mutation)
// ============================================================================

function CreateTaskForm() {
	const treaty = useTreaty()
	const queryClient = useQueryClient()
	const [isOpen, setIsOpen] = useState(false)

	const [formData, setFormData] = useState<CreateTaskInput>({
		title: '',
		description: '',
		status: 'todo',
		priority: 'medium'
	})

	const createTask = useMutation(
		treaty.api.tasks.mutationOptions({
			onSuccess() {
				// Invalidate and refetch
				queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
				queryClient.invalidateQueries(treaty.api.stats.pathFilter())

				// Reset form
				setFormData({
					title: '',
					description: '',
					status: 'todo',
					priority: 'medium'
				})
				setIsOpen(false)
			}
		})
	)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (formData.title.trim()) {
			createTask.mutate(formData)
		}
	}

	return (
		<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4"
			>
				{isOpen ? '− Close Form' : '+ New Task'}
			</button>

			{isOpen && (
				<form onSubmit={handleSubmit} className="space-y-4">
					<input
						type="text"
						placeholder="Task title"
						value={formData.title}
						onChange={(e) =>
							setFormData({ ...formData, title: e.target.value })
						}
						className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>

					<textarea
						placeholder="Description"
						value={formData.description}
						onChange={(e) =>
							setFormData({
								...formData,
								description: e.target.value
							})
						}
						className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						rows={3}
					/>

					<select
						value={formData.priority}
						onChange={(e) =>
							setFormData({
								...formData,
								priority: e.target.value as TaskPriority
							})
						}
						className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="low">Low Priority</option>
						<option value="medium">Medium Priority</option>
						<option value="high">High Priority</option>
					</select>

					<button
						type="submit"
						disabled={createTask.isPending}
						className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
					>
						{createTask.isPending ? 'Creating...' : 'Create Task'}
					</button>
				</form>
			)}
		</div>
	)
}

// ============================================================================
// 7. Real-time Updates (WebSocket Subscription)
// ============================================================================

function RealtimeStatus() {
	const treaty = useTreaty()
	const queryClient = useQueryClient()

	const ws = useSubscription(
		treaty.ws.tasks.subscriptionOptions(undefined, {
			enabled: true,
			onData(data: any) {
				console.log('Real-time update:', data)

				// Auto-refresh when tasks are updated
				if (data?.type === 'task-updated') {
					queryClient.invalidateQueries(treaty.api.tasks.pathFilter())
					queryClient.invalidateQueries(treaty.api.stats.pathFilter())
				}
			}
		})
	)

	const statusConfig = {
		connecting: {
			color: 'bg-yellow-100 text-yellow-700',
			icon: '🔄',
			text: 'Connecting...'
		},
		pending: {
			color: 'bg-green-100 text-green-700',
			icon: '✅',
			text: 'Connected'
		},
		error: {
			color: 'bg-red-100 text-red-700',
			icon: '❌',
			text: 'Disconnected'
		},
		idle: { color: 'bg-gray-100 text-gray-700', icon: '⏸️', text: 'Idle' }
	}

	const config = statusConfig[ws.status]

	return (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<h3 className="font-semibold text-slate-900 mb-3">
				Real-time Updates
			</h3>
			<div
				className={clsx(
					'px-4 py-2 rounded-lg flex items-center gap-2',
					config.color
				)}
			>
				<span className="text-lg">{config.icon}</span>
				<span className="font-medium">{config.text}</span>
			</div>
			<p className="text-xs text-slate-500 mt-3">
				Live updates via WebSocket subscription
			</p>
		</div>
	)
}

export default App
