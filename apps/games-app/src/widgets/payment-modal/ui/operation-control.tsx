import { SegmentedControl } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $operation, Operation, operationChanged } from '../model/form'

export const OperationControl = () => {
  const operation = useUnit($operation)

  return (
    <SegmentedControl
      value={operation}
      onChange={(value) => operationChanged(value as Operation)}
      data={[
        { label: 'Пополнение', value: 'deposit' satisfies Operation },
        { label: 'Вывод', value: 'withdrawal' satisfies Operation },
      ]}
    />
  )
}
