import { Badge, BadgeColor } from '@core/ui'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { $$pincodePage } from '../model'
import styles from './styles.module.css'

export const MultiplierTable = () => {
  const combination = useUnit($$pincodePage.$highlightedCombination)

  return (
    <div className="w-full flex justify-center flex-wrap gap-2">
      <Multiplier
        label="2x7"
        multiplier={5}
        color="red"
        highlighted={combination === '2x7'}
      />

      <Multiplier
        label="3x7"
        multiplier={100}
        color="orange"
        highlighted={combination === '3x7'}
      />

      <Multiplier
        label="1337"
        multiplier={111}
        color="orange"
        highlighted={combination === '1337'}
      />

      <Multiplier
        label="1488"
        multiplier={111}
        color="orange"
        highlighted={combination === '1488'}
      />

      <Multiplier
        label="0000"
        multiplier={250}
        color="yellow"
        highlighted={combination === '0000'}
      />

      <Multiplier
        label="1111"
        multiplier={250}
        color="yellow"
        highlighted={combination === '1111'}
      />

      <Multiplier
        label="2222"
        multiplier={250}
        color="yellow"
        highlighted={combination === '2222'}
      />

      <Multiplier
        label="3333"
        multiplier={250}
        color="yellow"
        highlighted={combination === '3333'}
      />

      <Multiplier
        label="4444"
        multiplier={250}
        color="yellow"
        highlighted={combination === '4444'}
      />

      <Multiplier
        label="5555"
        multiplier={250}
        color="yellow"
        highlighted={combination === '5555'}
      />

      <Multiplier
        label="6666"
        multiplier={250}
        color="yellow"
        highlighted={combination === '6666'}
      />

      <Multiplier
        label="8888"
        multiplier={250}
        color="yellow"
        highlighted={combination === '8888'}
      />

      <Multiplier
        label="9999"
        multiplier={250}
        color="yellow"
        highlighted={combination === '9999'}
      />

      <Multiplier
        label="7777"
        multiplier={1000}
        color="green"
        highlighted={combination === '7777'}
      />
    </div>
  )
}

const Multiplier = ({
  label,
  multiplier,
  color,
  highlighted,
}: {
  label: string
  multiplier: number
  color: BadgeColor
  highlighted?: boolean
}) => {
  return (
    <div className="w-24 flex items-center justify-center gap-2">
      <span className="text-xs">{label}</span>
      <Badge
        className={clsx(highlighted && styles.multiplierPulse)}
        color={color}
      >
        {multiplier}x
      </Badge>
    </div>
  )
}
