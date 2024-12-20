import { GameRecordSelect } from '@dbs/games-schema'
import { gemInt } from '@games/model'
import { z } from 'zod'

export const DicePayloadSchema = z.strictObject({
  bet: z
    .number()
    .int()
    .min(gemInt(1), 'Минимальная ставка - 1 гем')
    .max(gemInt(5000), 'Максимальная ставка - 5000 гемов'),
  sides: z.array(z.number().int().min(1).max(6)).min(1).max(5),
})

export type DicePayload = z.infer<typeof DicePayloadSchema>

export type PlayDiceInput = {
  userId: string
  payload: DicePayload
}

export type PlayDiceOutput = {
  updatedBalance: number
  record: GameRecordSelect
}
