import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from './routes'

export type ControlAPIRouter = AppRouter
export type ControlAPIInputs = inferRouterInputs<ControlAPIRouter>
export type ControlAPIOutputs = inferRouterOutputs<ControlAPIRouter>
