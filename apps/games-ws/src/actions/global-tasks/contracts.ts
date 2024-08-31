import { GlobalTaskKey } from '@dbs/games-types'
import { z } from 'zod'

export const GlobalTasksCompletePayloadSchema = z.object({
  taskKey: z.nativeEnum(GlobalTaskKey),
})

export const GlobalTasksClaimRewardPayloadSchema = z.object({
  taskKey: z.nativeEnum(GlobalTaskKey),
})

export type GlobalTasksCompletePayload = z.infer<
  typeof GlobalTasksCompletePayloadSchema
>

export type GlobalTasksClaimRewardPayload = z.infer<
  typeof GlobalTasksClaimRewardPayloadSchema
>

export type GlobalTasksCompleteOutput = void

export type GlobalTasksClaimRewardOutput = {
  payout: number
  updatedBalance: number
}
