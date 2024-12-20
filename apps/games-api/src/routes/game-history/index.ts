import { createRouter } from '../../app/router'
import { getBigWinsRoute } from './get-big-wins'
import { getLastWinsRoute } from './get-last-wins'
import { getMyGamesRoute } from './get-my-games'

export const gameHistoryRouter = createRouter()
  .route('/getLastWins', getLastWinsRoute)
  .route('/getBigWins', getBigWinsRoute)
  .route('/getMyGames', getMyGamesRoute)
