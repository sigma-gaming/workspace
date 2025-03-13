import {
  $$notifications,
  confirmationFactory,
  handleExceptions,
} from '@core/client'
import { createField, createForm } from '@core/forms'
import { createMutation } from '@farfetched/core'
import { gemInt } from '@games/model'
import { invoke } from '@withease/factories'
import dayjs from 'dayjs'
import { createEvent, createStore, sample } from 'effector'
import { reset } from 'patronum'
import { z } from 'zod'
import { routes } from '../../routing'
import {
  getPromocodesRandom,
  postPromocodesCreate,
  PromocodeBonusType,
} from '../../shared/api/control'
import { createApiEffect } from '../../shared/api/effects'

const getRandomPromocodeFx = createApiEffect(getPromocodesRandom)

const createPromocodesMutation = createMutation({
  name: 'promocodes/create',
  effect: createApiEffect(postPromocodesCreate),
})

const generatePromocode = createEvent()

const $createdCodes = createStore<string[]>([])
const $submitting = createPromocodesMutation.$pending
const $generatingPromocode = getRandomPromocodeFx.pending

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
    code: z.string(),
    expiresAt: z.string().datetime(),
    bonusType: z.nativeEnum(PromocodeBonusType),
    payout: z.number().min(gemInt(1), 'Не может быть меньше 1 гема'),
    wageringMultiplier: z.number(),
    maxUsages: z.number().min(1, 'Не может быть меньше 1'),
    userId: z
      .string()
      .uuid('Неправильно введен ID')
      .or(z.string().length(0))
      .transform((value) => value || null),
    isActive: z.boolean(),
  }),
})

type FormOutput = typeof form.$inferOutput

const { open, confirmed } = invoke(() =>
  confirmationFactory<FormOutput>((context) => ({
    title: 'Подтверждение',
    children:
      `Сумма выплат ${context.count > 1 ? 'промокодов' : 'промокода'}` +
      ` составляет более 10,000 гемов. Вы уверены, что хотите создать этот промокод?`,
  })),
)

function total({ count, maxUsages, payout }: FormOutput) {
  return payout * maxUsages * count
}

sample({
  source: generatePromocode,
  target: getRandomPromocodeFx,
})

sample({
  source: getRandomPromocodeFx.doneData,
  fn: ({ promocode }) => promocode,
  target: fields.code.update,
})

const isTotalMoreThan10000 = (values: FormOutput) =>
  total(values) > gemInt(10000)

sample({
  source: form.submitted,
  filter: isTotalMoreThan10000,
  target: open,
})

sample({
  source: form.submitted,
  filter: (values) => !isTotalMoreThan10000(values),
  target: createPromocodesMutation.start,
})

sample({
  source: confirmed,
  target: createPromocodesMutation.start,
})

sample({
  source: createPromocodesMutation.finished.success,
  fn: ({ result }) => result.codes,
  target: $createdCodes,
})

sample({
  clock: createPromocodesMutation.finished.success,
  target: $$notifications.show.prepend(() => ({
    color: 'green',
    title: 'Промокоды успешно созданы',
    message:
      'Найти промокоды и изменить их параметры можно в списке промокодов',
  })),
})

handleExceptions(createPromocodesMutation, { form })

reset({
  clock: [routes.promocodes.closed, form.submit],
  target: [$createdCodes],
})

sample({
  clock: routes.promocodes.closed,
  target: form.reset,
})

export const $$promocodesPage = {
  fields,
  form,
  generatePromocode,
  $submitting,
  $generatingPromocode,
  $createdCodes,
}
