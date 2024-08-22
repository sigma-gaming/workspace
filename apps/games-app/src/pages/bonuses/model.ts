import {
  $$notifications,
  createApiEffect,
  handleExceptions,
} from '@core/client'
import { createField, createForm } from '@core/forms'
import { createMutation } from '@farfetched/core'
import { formatGem } from '@games/model'
import { createEvent, sample } from 'effector'
import { z } from 'zod'
import { $$balance } from '../../entities/balance'
import { routes } from '../../routing'
import { gamesApi } from '../../shared/api/games'

const reset = createEvent()

const applyPromocodeMutation = createMutation({
  name: 'bonuses/applyPromocode',
  effect: createApiEffect(gamesApi.promocodes.apply.$post),
})

$$balance.receiveUpdates(applyPromocodeMutation, (data) => data.updatedBalance)

const $applyingPromocode = applyPromocodeMutation.$pending

const promocodeFields = {
  code: createField({
    emptyValue: '',
  }),
}

const promocodeForm = createForm({
  fields: promocodeFields,
  schema: z.object({
    code: z.string(),
  }),
})

sample({
  source: promocodeForm.submitted,
  target: applyPromocodeMutation.start,
})

handleExceptions(applyPromocodeMutation, { form: promocodeForm })

sample({
  clock: applyPromocodeMutation.finished.success,
  fn: ({ result }) =>
    $$notifications.options({
      color: 'green',
      title: 'Промокод активирован',
      message: `Баланс пополнен на ${formatGem(result.payout / 100)}g`,
    }),
  target: $$notifications.show,
})

sample({
  clock: reset,
  target: promocodeForm.reset,
})

sample({
  clock: routes.bonuses.closed,
  target: reset,
})

export const $$bonusesPage = {
  promocodeFields,
  promocodeForm,
  $applyingPromocode,
}
