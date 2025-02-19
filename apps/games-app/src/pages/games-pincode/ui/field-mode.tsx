import { Input, SegmentedControl, SegmentedControlItem } from '@mantine/core'
import { IconBabyCarriage, IconFlame } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { PincodeMode } from '../../../shared/api/core'
import { $$pincodePage } from '../model'

type Option = SegmentedControlItem & { value: string }

const options: Option[] = [
  {
    label: (
      <div className="flex gap-1 items-center justify-center">
        <IconBabyCarriage width={16} height={16} />
        <span>Easy</span>
      </div>
    ),
    value: String(PincodeMode.Easy),
  },
  {
    label: (
      <div className="flex gap-1 items-center justify-center">
        <IconFlame width={16} height={16} />
        <span>Hardcore</span>
      </div>
    ),
    value: String(PincodeMode.Hardcore),
  },
]

const colorMap: Record<PincodeMode, string> = {
  [PincodeMode.Easy]: 'green.8',
  [PincodeMode.Hardcore]: 'orange.8',
}

export const ModeField = () => {
  const value = useUnit($$pincodePage.fields.mode.$value)
  const autoplaying = useUnit($$pincodePage.$autoplaying)

  return (
    <div className="flex flex-col gap-2">
      <Input.Label>Сложность</Input.Label>
      <SegmentedControl
        classNames={{
          root: 'rounded-3xl',
          indicator: 'rounded-[20px]',
        }}
        fullWidth
        withItemsBorders={false}
        value={String(value)}
        onChange={(value) =>
          $$pincodePage.fields.mode.update(value as PincodeMode)
        }
        color={colorMap[value]}
        data={options}
        disabled={autoplaying}
      />
    </div>
  )
}
