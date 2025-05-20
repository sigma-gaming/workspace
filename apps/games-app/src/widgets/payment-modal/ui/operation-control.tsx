import { SegmentedControl } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $creatingPayment } from '../model/form'
import { $operation, chooseOperation, Operation } from '../model/modal'

export const OperationControl = () => {
  const operation = useUnit($operation)
  const creatingPayment = useUnit($creatingPayment)

  return (
    <SegmentedControl
      value={operation ?? Operation.Deposit}
      onChange={(value) => chooseOperation(value as Operation)}
      data={[
        { label: 'Пополнение', value: Operation.Deposit },
        { label: 'Вывод', value: Operation.Withdrawal },
      ]}
      disabled={creatingPayment}
    />
  )
}
