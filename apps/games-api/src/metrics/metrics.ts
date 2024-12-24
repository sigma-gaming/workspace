import { Counter, Histogram } from 'prom-client'
import { registry } from './registry'

export const betsAmountCounter = new Counter({
  name: 'games_api_bets_amount',
  help: 'Amount of bets',
  labelNames: ['game'],
})

export const winsAmountCounter = new Counter({
  name: 'games_api_wins_amount',
  help: 'Amount of wins',
  labelNames: ['game'],
})

export const lossesAmountCounter = new Counter({
  name: 'games_api_losses_amount',
  help: 'Amount of losses',
  labelNames: ['game'],
})

export const diceSidesHistogram = new Histogram({
  name: 'games_api_dice_sides',
  help: 'Dice sides',
  buckets: [1, 2, 3, 4, 5],
})

export const pincodeGamesCounter = new Counter({
  name: 'games_api_pincode_games',
  help: 'Amount of pincode games',
  labelNames: ['mode'],
})

registry.registerMetric(betsAmountCounter)
registry.registerMetric(winsAmountCounter)
registry.registerMetric(lossesAmountCounter)
registry.registerMetric(diceSidesHistogram)
registry.registerMetric(pincodeGamesCounter)
