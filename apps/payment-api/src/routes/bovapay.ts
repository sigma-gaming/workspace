import { BadRequestException, UnauthorizedException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { PaymentStatus } from '@dbs/games-types'
import { bovapayService, paymentService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../hono'

function withOrder<Schema extends z.ZodObject<z.ZodRawShape>>(schema: Schema) {
  return z.custom((value) => schema.safeParse(value).success) as Schema
}

enum BovapayStatus {
  Successed = 'successed',
  AcceptedSuccessed = 'accepted_successed',
  Failed = 'failed',
  ClosedFailed = 'closed_failed',
}

const PayloadSchema = withOrder(
  z.object({
    id: z.string().uuid(),
    merchant_id: z.string(),
    status: z.nativeEnum(BovapayStatus),
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

function mapStatus(status: BovapayStatus): PaymentStatus {
  if (status === BovapayStatus.Successed) return PaymentStatus.Completed
  if (status === BovapayStatus.AcceptedSuccessed) return PaymentStatus.Completed
  if (status === BovapayStatus.Failed) return PaymentStatus.Failed
  if (status === BovapayStatus.ClosedFailed) return PaymentStatus.Failed
  throw new Error('Unknown bovapay status')
}

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

    const deposit = await paymentService.getDepositByProviderTransactionId(
      payload.id,
    )

    if (!deposit) {
      throw new BadRequestException({
        message: 'Deposit not found',
      })
    }

    const newStatus = mapStatus(payload.status)

    await paymentService.handleDepositStatusUpdate(deposit.id, newStatus)

    ctx.status(200)
    return ctx.text('Payment processed successfully')
  },
)
