import { formatGem } from '@games/model'
import { IconFlame } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { $$dicePage } from '../model.ts'

export const PossibleWinAmount = () => {
  const sides = useUnit($$dicePage.fields.sides.$value)
  const possibleWinAmount = useUnit($$dicePage.$possibleWinAmount)

  return (
    <div className="flex items-center justify-center gap-0.5">
      <IconFlame className="text-[#FF7A00] w-6 h-6" />
      <p className="text-sm">
        Возможный выигрыш:{' '}
        <span className="text-green-400 font-medium">
          {sides.length === 0 || sides.length === 6
            ? '?'
            : `${formatGem(possibleWinAmount)}g`}
        </span>
      </p>
    </div>
  )
}
