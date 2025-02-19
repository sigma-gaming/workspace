import { Badge, BadgeColor } from '@core/ui'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { getPincodeMultiplierMap } from '../lib/config'
import { $$pincodePage } from '../model'
import styles from './styles.module.css'

const combinedCombinations: Array<{
  label: string
  combineIn: string
  combinations: string[]
}> = [
  {
    label: '1111-5555',
    combineIn: '1111',
    combinations: ['1111', '2222', '3333', '4444', '5555'],
  },
]

function getColor(multiplier: number) {
  if (multiplier >= 250) return 'green'
  if (multiplier >= 100) return 'yellow'
  if (multiplier >= 50) return 'orange'
  return 'red'
}

export const MultiplierTable = () => {
  const highlightedCombination = useUnit($$pincodePage.$highlightedCombination)
  const mode = useUnit($$pincodePage.fields.mode.$value)
  const multiplierMap = getPincodeMultiplierMap(mode)

  const multiplierList = Object.entries(multiplierMap)
    .reduce(
      (acc, [combination, multiplier = 0]) => {
        const combined = combinedCombinations.find((combined) =>
          combined.combinations.includes(combination),
        )

        if (!combined) {
          acc.push({
            label: combination,
            combinations: [combination],
            multiplier,
          })

          return acc
        }

        if (combined.combineIn !== combination) {
          return acc
        }

        return acc.concat({
          label: combined.label,
          combinations: combined.combinations,
          multiplier,
        })
      },
      [] as { label: string; combinations: string[]; multiplier: number }[],
    )
    .sort((a, b) => {
      if (a.multiplier === b.multiplier) {
        return a.label.localeCompare(b.label)
      }

      return a.multiplier - b.multiplier
    })

  return (
    <div className="w-full flex justify-center flex-wrap gap-2">
      {multiplierList.map(({ label, combinations, multiplier }) => (
        <Multiplier
          key={label}
          label={label}
          multiplier={multiplier}
          color={getColor(multiplier)}
          highlighted={
            Boolean(highlightedCombination) &&
            combinations.includes(highlightedCombination!)
          }
        />
      ))}
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
    <div className="min-w-24 flex items-center justify-center gap-2">
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
