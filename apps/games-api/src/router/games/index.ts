import { Hono } from 'hono'
import { playDicesRoute } from './dices'

export const gamesRouter = new Hono().route('/playDices', playDicesRoute)
