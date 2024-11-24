import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import {
  Button,
  Modal,
  NumberInput,
  Select,
  Tabs,
  TextInput,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { memo, useEffect } from 'react'
import { $$paymentsModal } from './model'

type Props = {
  opened: boolean
  onClose: () => void
}

export const PaymentsModal = memo(({ opened, onClose }: Props) => {
  const { initialize, reset } = $$paymentsModal
  const { fields: depositFields } = $$paymentsModal.deposit
  const { fields: withdrawFields } = $$paymentsModal.withdraw
  const { submit: submitDeposit } = $$paymentsModal.deposit.form
  const { submit: submitWithdraw } = $$paymentsModal.withdraw.form

  // Deposit form fields
  const depositAmount = useUnit(depositFields.amount.$value)
  const depositProvider = useUnit(depositFields.provider.$value)
  const depositMethod = useUnit(depositFields.method.$value)
  const depositCurrency = useUnit(depositFields.currency.$value)
  const depositPending = useUnit($$paymentsModal.deposit.$pending)

  // Withdraw form fields
  const withdrawAmount = useUnit(withdrawFields.amount.$value)
  const withdrawProvider = useUnit(withdrawFields.provider.$value)
  const withdrawMethod = useUnit(withdrawFields.method.$value)
  const withdrawCurrency = useUnit(withdrawFields.currency.$value)
  const withdrawAccountDetails = useUnit(withdrawFields.accountDetails.$value)
  const withdrawPending = useUnit($$paymentsModal.withdraw.$pending)

  // Payment history
  const paymentHistory = useUnit($$paymentsModal.history.$data)
  const loadingHistory = useUnit($$paymentsModal.history.$loading)

  useEffect(() => {
    if (opened) {
      initialize()
    } else {
      reset()
    }
  }, [opened, initialize, reset])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Payments"
      size="lg"
      className="p-6"
    >
      <Tabs defaultValue="deposit">
        <Tabs.List>
          <Tabs.Tab value="deposit">Deposit</Tabs.Tab>
          <Tabs.Tab value="withdraw">Withdraw</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="deposit" className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submitDeposit()
            }}
            className="flex flex-col gap-4"
          >
            <NumberInput
              label="Amount"
              value={depositAmount}
              onChange={(value) => depositFields.amount.update(String(value))}
              min={1}
              required
            />
            <Select
              label="Payment Provider"
              value={depositProvider}
              onChange={(value) =>
                depositFields.provider.update(value as PaymentProvider)
              }
              data={Object.values(PaymentProvider)}
              required
            />
            <Select
              label="Payment Method"
              value={depositMethod}
              onChange={(value) =>
                depositFields.method.update(value as DepositMethod)
              }
              data={Object.values(DepositMethod)}
              required
            />
            <Select
              label="Currency"
              value={depositCurrency}
              onChange={(value) =>
                depositFields.currency.update(value as Currency)
              }
              data={Object.values(Currency)}
              required
            />
            <Button type="submit" loading={depositPending} className="mt-2">
              Make Deposit
            </Button>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="withdraw" className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submitWithdraw()
            }}
            className="flex flex-col gap-4"
          >
            <NumberInput
              label="Amount"
              value={withdrawAmount}
              onChange={(value) => withdrawFields.amount.update(String(value))}
              min={1}
              required
            />
            <Select
              label="Payment Provider"
              value={withdrawProvider}
              onChange={(value) =>
                withdrawFields.provider.update(value as PaymentProvider)
              }
              data={Object.values(PaymentProvider)}
              required
            />
            <Select
              label="Payment Method"
              value={withdrawMethod}
              onChange={(value) =>
                withdrawFields.method.update(value as WithdrawalMethod)
              }
              data={Object.values(WithdrawalMethod)}
              required
            />
            <Select
              label="Currency"
              value={withdrawCurrency}
              onChange={(value) =>
                withdrawFields.currency.update(value as Currency)
              }
              data={Object.values(Currency)}
              required
            />
            <TextInput
              label="Account Details"
              value={withdrawAccountDetails}
              onChange={(e) =>
                withdrawFields.accountDetails.update(e.target.value)
              }
              placeholder="Enter your payment details"
              required
            />
            <Button type="submit" loading={withdrawPending} className="mt-2">
              Make Withdrawal
            </Button>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="history" className="mt-4">
          {loadingHistory ? (
            <div className="flex justify-center">
              Loading payment history...
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center text-gray-500">
              No payment history found
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {payment.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-right">
                      {payment.amount} {payment.currency}
                    </div>
                    <div className="text-sm text-right">
                      Status: {payment.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
})
