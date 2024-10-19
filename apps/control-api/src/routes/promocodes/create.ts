import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { gamesDb } from '@dbs/games-db'
import { PromocodeTable } from '@dbs/games-schema'
import { PromocodeBonus, PromocodeBonusType, UserRole } from '@dbs/games-types'
import { gemInt } from '@games/model'
import { promocodeService, roleService, userService } from '@games/services'
import { count, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { createRouter } from '../../hono'

export const createRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      campaign: z.string().min(1, 'Не может быть пустым'),
      count: z.number().min(1, 'Не может быть меньше 1'),
      code: z.string(),
      expiresAt: z.string().datetime(),
      bonusType: z.nativeEnum(PromocodeBonusType),
      payout: z.number().min(gemInt(1), 'Не может быть меньше 1 гема'),
      wageringMultiplier: z.number(),
      maxUsages: z.number().min(1, 'Не может быть меньше 1'),
      userId: z.string().uuid('Неправильно введен ID').or(z.string().length(0)),
      isActive: z.boolean(),
    }),
  ),
  async (ctx) => {
    const session = ctx.get('session')
    const user = await userService.getUser(session.userId)
    roleService.assert(user, UserRole.Admin)

    const payload = ctx.req.valid('json')

    if (payload.userId && payload.maxUsages > 1) {
      throw new BadRequestException({
        path: ['maxUsages'],
        message: 'Персональный промокод должен быть одноразовым',
      })
    }

    if (new Date() >= new Date(payload.expiresAt)) {
      throw new BadRequestException({
        path: ['expiresAt'],
        message: 'Дата истечения уже наступила',
      })
    }

    if (payload.count === 1 && !payload.code) {
      throw new BadRequestException({
        path: ['code'],
        message: 'Не может быть пустым',
      })
    }

    const codes: string[] = []

    if (payload.count === 1) {
      codes.push(payload.code)
    } else {
      codes.push(...promocodeService.generateMany(payload))
    }

    const [{ count: existingCount }] = await gamesDb
      .select({ count: count() })
      .from(PromocodeTable)
      .where(inArray(PromocodeTable.code, codes))

    if (existingCount > 0) {
      if (payload.count === 1) {
        throw new BadRequestException({
          path: ['code'],
          message: 'Промокод уже существует',
        })
      }

      throw new BadRequestException({
        message:
          'Один или несколько промокодов уже существуют. Попробуйте еще раз',
      })
    }

    let bonus: PromocodeBonus

    if (payload.bonusType === PromocodeBonusType.Payout) {
      bonus = {
        type: PromocodeBonusType.Payout,
        payout: payload.payout,
      }
    }

    await gamesDb.transaction(async (tx) => {
      for (const code of codes) {
        await tx.insert(PromocodeTable).values({
          campaign: payload.campaign,
          code,
          bonusType: payload.bonusType,
          bonus,
          wageringMultiplier: payload.wageringMultiplier,
          usages: 0,
          maxUsages: payload.maxUsages,
          isActive: payload.isActive,
          userId: payload.userId ? payload.userId : null,
          expiresAt: payload.expiresAt,
          createdBy: user.id,
        })
      }
    })

    return ctx.json({ status: 'success', codes })
  },
)
