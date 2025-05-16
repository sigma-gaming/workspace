import { Badge, BadgeColor } from '@core/ui'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { PincodeMode } from '../../../shared/api/core'
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

function getEasyColor(multiplier: number): BadgeColor {
  if (multiplier >= 270) return 'amber'
  if (multiplier >= 135) return 'rose'
  if (multiplier >= 100) return 'fuchsia'
  if (multiplier >= 50) return 'violet'
  return 'sky'
}

function getHardcoreColor(multiplier: number): BadgeColor {
  if (multiplier >= 750) return 'amber'
  if (multiplier >= 400) return 'rose'
  if (multiplier >= 300) return 'fuchsia'
  if (multiplier >= 100) return 'violet'
  return 'sky'
}

function getColor(mode: PincodeMode, multiplier: number) {
  if (mode === PincodeMode.Easy) return getEasyColor(multiplier)
  return getHardcoreColor(multiplier)
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
          color={getColor(mode, multiplier)}
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
