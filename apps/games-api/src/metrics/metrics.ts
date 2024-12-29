import { Counter, Histogram } from 'prom-client'
import { registry } from './registry'

export const betsAmountCounter = new Counter({
  name: 'games_bets_amount',
  help: 'Amount of bets',
  labelNames: ['game'],
})

export const diceSidesHistogram = new Histogram({
  name: 'games_dice_sides',
  help: 'Dice sides',
  buckets: [1, 2, 3, 4, 5],
})

export const pincodeGamesCounter = new Counter({
  name: 'games_pincode_games',
  help: 'Number of pincode games by mode',
  labelNames: ['mode'],
})

registry.registerMetric(betsAmountCounter)
registry.registerMetric(diceSidesHistogram)
registry.registerMetric(pincodeGamesCounter)
