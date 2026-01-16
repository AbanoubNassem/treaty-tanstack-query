import { createRoot } from 'react-dom/client'
import { useQuery } from '@tanstack/react-query'

import Layout from '../layouts'
import { treaty } from '../libs/api'

function App() {
	const { data: response, isLoading } = useQuery({
		queryKey: ['user', 'me'],
		queryFn: () => treaty.api.user.me.get()
	})

	return (
		<>
			<img src="/images/maddelena-2.webp" className="max-w-40" />
			<h1 className="text-3xl">API call!</h1>
			{isLoading ? (
				<h2 className="text-6xl">Loading...</h2>
			) : (
				<h2 className="text-6xl">{response?.data?.name}</h2>
			)}
		</>
	)
}

const root = createRoot(document.getElementById('elysia')!)
root.render(
	<Layout className="gap-6">
		<App />
	</Layout>
)
