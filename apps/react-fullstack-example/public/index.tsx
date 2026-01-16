import { createRoot } from 'react-dom/client'

import Layout from '@public/layouts'
import App from './app'

const root = createRoot(document.getElementById('elysia')!)
root.render(
	<Layout className="gap-6">
		<App />
	</Layout>
)
