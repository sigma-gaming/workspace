import { createRouter } from '../../app/router'

export const ping = createRouter().get('/', async (ctx) => {
  return ctx.json('pong')
})
