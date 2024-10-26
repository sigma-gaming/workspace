import { z } from 'zod'

export const SignInPayloadSchema = z.object({
  accessToken: z.string(),
})

export type SignInPayload = z.infer<typeof SignInPayloadSchema>
