import { Hono } from 'hono'
import { getBigWinsRoute } from './get-big-wins'
import { getLastWinsRoute } from './get-last-wins'
import { getMyGamesRoute } from './get-my-games'

export const gameHistoryRouter = new Hono()
  .route('/getLastWins', getLastWinsRoute)
  .route('/getBigWins', getBigWinsRoute)
  .route('/getMyGames', getMyGamesRoute)
