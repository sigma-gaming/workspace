import { Hono } from 'hono'
import { playDiceRoute } from './dice'

export const gamesRouter = new Hono().route('/playDice', playDiceRoute)
