import { Hono } from 'hono'
import { getLastWins } from './get-last-wins'
import { getMyGames } from './get-my-games'

export const gameHistoryRouter = new Hono()
  .route('/getLastWins', getLastWins)
  .route('/getMyGames', getMyGames)
