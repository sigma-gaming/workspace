import { BadRequestException, UnauthorizedException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { bovapayService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../hono'

function withOrder<Schema extends z.ZodObject<z.ZodRawShape>>(schema: Schema) {
  return z.custom((value) => schema.safeParse(value).success) as Schema
}

const PayloadSchema = withOrder(
  z.object({
    id: z.string().uuid(),
    merchant_id: z.string(),
    status: z.enum([
      'successed',
      'accepted_successed',
      'failed',
      'closed_failed',
    ]),
    message: z.string(),
    currency: z.string(),
    payment_method: z.string(),
    rate: z.number(),
    amount: z.string(),
    fiat_amount: z.string(),
    old_fiat_amount: z.string(),
    service_commission: z.string(),
    total_amount: z.string(),
    payeer_card_number: z.string().nullable(),
    recipient_card_number: z.string(),
    recipient_card_number_type: z.enum(['card', 'phone_number']),
  }),
)

export const bovapayRoute = createRouter().post(
  '/',
  zValidator('json', PayloadSchema),
  async (ctx) => {
    const payload = ctx.req.valid('json')

    // Verify signature from headers
    const signature = ctx.req.header('signature')
    if (!signature) {
      throw new BadRequestException({
        message: 'Missing signature header',
      })
    }

    const isValidSignature = bovapayService.verifySignature(payload, signature)
    if (!isValidSignature) {
      throw new UnauthorizedException()
    }

    console.log(payload)

    // Handle different payment statuses
    switch (payload.status) {
      case 'successed':
      case 'accepted_successed':
        // TODO: Handle successful payment
        return ctx.json({
          status: 'success',
          message: 'Payment processed successfully',
          transactionId: payload.id,
        })

      case 'failed':
        // TODO: Handle failed payment
        return ctx.json({
          status: 'error',
          message: `Payment failed: ${payload.message}`,
          transactionId: payload.id,
        })

      case 'closed_failed':
        // TODO: Handle rejected after appeal
        return ctx.json({
          status: 'error',
          message: `Payment rejected after appeal: ${payload.message}`,
          transactionId: payload.id,
        })

      default:
        throw new BadRequestException({
          message: 'Unknown payment status',
        })
    }
  },
)
