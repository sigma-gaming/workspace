import { createDefer } from '@core/utils'
import { modals } from '@mantine/modals'
import { createFactory } from '@withease/factories'
import { createEffect, createEvent, sample } from 'effector'

type ConfirmModalOptions = Parameters<typeof modals.openConfirmModal>[0]

export const confirmationFactory = createFactory(
  <T>(createOptions: (context: T) => ConfirmModalOptions) => {
    const open = createEvent<T>()
    const confirmed = createEvent<T>()
    const canceled = createEvent<T>()

    const openFx = createEffect<T, T, T>((context: T): Promise<T> => {
      const defer = createDefer<T, T>()

      modals.openConfirmModal({
        labels: { confirm: 'Подтвердить', cancel: 'Отмена' },
        centered: true,
        ...createOptions(context),
        onConfirm: () => defer.resolve(context),
        onCancel: () => defer.reject(context),
      })

      return defer.promise
    })

    sample({
      source: open,
      target: openFx,
    })

    sample({
      source: openFx.doneData,
      target: confirmed,
    })

    sample({
      source: openFx.failData,
      target: canceled,
    })

    return { open, confirmed, canceled }
  },
)
