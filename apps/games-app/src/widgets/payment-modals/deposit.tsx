import { Currency, DepositMethod, PaymentProvider } from '@dbs/games-types'
import { Button, Modal, NumberInput, Select } from '@mantine/core'
import { useUnit } from 'effector-react'
import { memo } from 'react'
import { $depositOpened, closeDeposit } from './model/modals'
import { depositFields, depositForm, depositMutation } from './model/payments'

export const DepositModal = memo(() => {
  const opened = useUnit($depositOpened)
  const depositAmount = useUnit(depositFields.amount.$value)
  const depositProvider = useUnit(depositFields.provider.$value)
  const depositMethod = useUnit(depositFields.method.$value)
  const depositCurrency = useUnit(depositFields.currency.$value)
  const { pending } = useUnit(depositMutation)

  // Payment history
  // const paymentHistory = useUnit($$payments.history.$data)
  // const loadingHistory = useUnit($$payments.history.$loading)

  return (
    <Modal
      opened={opened}
      onClose={closeDeposit}
      title="Пополнение"
      size="lg"
      className="p-6"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          depositForm.submit()
        }}
        className="flex flex-col gap-4"
      >
        <NumberInput
          label="Сумма"
          placeholder="Введите сумму"
          value={depositAmount}
          onChange={(value) => depositFields.amount.update(String(value))}
          min={1}
          required
        />
        <Select
          label="Провайдер"
          value={depositProvider}
          onChange={(value) =>
            depositFields.provider.update(value as PaymentProvider)
          }
          data={Object.values(PaymentProvider)}
          required
        />
        <Select
          label="Метод"
          value={depositMethod}
          onChange={(value) =>
            depositFields.method.update(value as DepositMethod)
          }
          data={Object.values(DepositMethod)}
          required
        />
        <Select
          label="Валюта"
          value={depositCurrency}
          onChange={(value) => depositFields.currency.update(value as Currency)}
          data={Object.values(Currency)}
          required
        />
        <Button type="submit" loading={pending} className="mt-2">
          Продолжить
        </Button>
      </form>
    </Modal>
  )
})
