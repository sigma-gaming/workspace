import { ActionIcon, InputLabel, NumberInput } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$pincodePage } from '../model'

export const BetField = () => {
  const bet = useUnit($$pincodePage.fields.bet.$value)
  const errors = useUnit($$pincodePage.form.$errors)
  const autoplaying = useUnit($$pincodePage.$autoplaying)

  return (
    <div className="flex flex-col gap-2">
      <InputLabel htmlFor="bet-field">Ставка</InputLabel>
      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-start">
          <NumberInput
            id="bet-field"
            className="grow"
            classNames={{ wrapper: 'mt-0' }}
            value={bet}
            onChange={(value) => $$pincodePage.fields.bet.update(String(value))}
            allowedDecimalSeparators={[',', '.']}
            error={errors.bet[0]}
            disabled={autoplaying}
            min={1}
            decimalScale={2}
          />
          <ActionIcon
            className="text-sm text-[var(--input-color)] disabled:bg-[color:var(--mantine-color-input-bg)] disabled:opacity-60"
            size={36}
            color="var(--mantine-color-input-bg)"
            onClick={() => $$pincodePage.betDoubled()}
            disabled={autoplaying}
          >
            x2
          </ActionIcon>
          <ActionIcon
            className="text-sm text-[var(--input-color)] disabled:bg-[color:var(--mantine-color-input-bg)] disabled:opacity-60"
            size={36}
            color="var(--mantine-color-input-bg)"
            onClick={() => $$pincodePage.betHalved()}
            disabled={autoplaying}
          >
            /2
          </ActionIcon>
        </div>
      </div>
    </div>
  )
}
