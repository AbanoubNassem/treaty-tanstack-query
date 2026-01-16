import { treaty as TreatyClient } from '@elysiajs/eden'

import type { app } from '@server'

export const treaty = TreatyClient<typeof app>('localhost:3000')
