import { PincodeMode } from '@dbs/games-types'
import { Input, SegmentedControl, SegmentedControlItem } from '@mantine/core'
import { IconBabyCarriage, IconFlame } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { $$pincodePage } from '../model'

type Option = SegmentedControlItem & { value: PincodeMode }

const options: Option[] = [
  {
    label: (
      <div className="flex gap-1 items-center justify-center">
        <IconBabyCarriage width={16} height={16} />
        <span>Easy</span>
      </div>
    ),
    value: PincodeMode.Easy,
  },
  {
    label: (
      <div className="flex gap-1 items-center justify-center">
        <IconFlame width={16} height={16} />
        <span>Hardcore</span>
      </div>
    ),
    value: PincodeMode.Hardcore,
  },
]

const colorMap: Record<PincodeMode, string> = {
  easy: 'green.8',
  hardcore: 'orange.8',
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
        value={value}
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
