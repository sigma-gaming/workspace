import { createField, createForm } from '@core/forms'
import { PromocodeBonusType } from '@dbs/games-types'
import { gemInt } from '@games/model'
import dayjs from 'dayjs'
import { createStore } from 'effector'
import { z } from 'zod'

const $submitting = createStore(false)

const fields = {
  campaign: createField({ emptyValue: '' }),
  count: createField({ emptyValue: 1 }),
  code: createField({ emptyValue: '' }),
  expiresAt: createField({ emptyValue: dayjs().add(7, 'days').toISOString() }),
  bonusType: createField<PromocodeBonusType>({
    emptyValue: PromocodeBonusType.Payout,
  }),
  payout: createField({ emptyValue: gemInt(10) }),
  wageringMultiplier: createField({ emptyValue: 5 }),
  maxUsages: createField({ emptyValue: 1 }),
  userId: createField({ emptyValue: '' }),
  isActive: createField({ emptyValue: true }),
}

const form = createForm({
  fields,
  schema: z.object({
    campaign: z.string().min(1, 'Не может быть пустым'),
    count: z.number().min(1, 'Не может быть меньше 1'),
    code: z.string().min(1, 'Не может быть пустым'),
    expiresAt: z.string().datetime(),
    bonusType: z.nativeEnum(PromocodeBonusType),
    payout: z.number().min(gemInt(1), 'Не может быть меньше 1 гема'),
    wageringMultiplier: z.number(),
    maxUsages: z.number().min(1, 'Не может быть меньше 1'),
    userId: z.string().uuid('Неправильно введен ID').or(z.string().length(0)),
    isActive: z.boolean(),
  }),
})

export const $$promocodesPage = {
  fields,
  form,
  $submitting,
}
