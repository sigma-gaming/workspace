import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from './routes'

export type GamesAPIRouter = AppRouter
export type GamesAPIInput = inferRouterInputs<GamesAPIRouter>
export type GamesAPIOutput = inferRouterOutputs<GamesAPIRouter>
