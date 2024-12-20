import { GameRecordSelect } from '@dbs/games-schema'
import { gemInt, PincodeMode } from '@games/model'
import { z } from 'zod'

export const PincodePayloadSchema = z.strictObject({
  bet: z
    .number()
    .int()
    .min(gemInt(1), 'Минимальная ставка - 1 гем')
    .max(gemInt(5000), 'Максимальная ставка - 5000 гемов'),
  mode: z.nativeEnum(PincodeMode),
})

export type PincodePayload = z.infer<typeof PincodePayloadSchema>

export type PlayPincodeInput = {
  userId: string
  payload: PincodePayload
}

export type PlayPincodeOutput = {
  updatedBalance: number
  record: GameRecordSelect
}
