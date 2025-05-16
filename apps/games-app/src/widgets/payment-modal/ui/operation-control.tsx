import { SegmentedControl } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $operation } from '../model/form'
import { $$paymentModal, Operation } from '../model/modal'

export const OperationControl = () => {
  const operation = useUnit($operation)

  return (
    <SegmentedControl
      value={operation ?? Operation.Deposit}
      onChange={(value) => {
        if (value === Operation.Deposit) $$paymentModal.openDeposit()
        if (value === Operation.Withdrawal) $$paymentModal.openWithdrawal()
      }}
      data={[
        { label: 'Пополнение', value: Operation.Deposit },
        { label: 'Вывод', value: Operation.Withdrawal },
      ]}
    />
  )
}
