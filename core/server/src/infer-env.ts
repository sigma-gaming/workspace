import { Hono } from 'hono'

// eslint-disable-next-line @typescript-eslint/naming-convention
export type inferEnv<App extends Hono<any>> =
  App extends Hono<infer Env> ? Env : never
