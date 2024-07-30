import { Hono } from 'hono'
import { getBigWins } from './get-big-wins'
import { getLastWins } from './get-last-wins'
import { getMyGames } from './get-my-games'

export const gameHistoryRouter = new Hono()
  .route('/getLastWins', getLastWins)
  .route('/getBigWins', getBigWins)
  .route('/getMyGames', getMyGames)
