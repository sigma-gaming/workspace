import { WithError } from '@core/ui'
import { ActionIcon, InputLabel, NumberInput } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$dicePage } from '../model'

export const BetField = () => {
  const bet = useUnit($$dicePage.fields.bet.$value)
  const errors = useUnit($$dicePage.form.$errors)
  const autoplaying = useUnit($$dicePage.$autoplaying)

  return (
    <div className="flex flex-col gap-2">
      <InputLabel htmlFor="bet-field">Ставка</InputLabel>
      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-start">
          <WithError error={errors.bet[0]}>
            <NumberInput
              id="bet-field"
              className="grow"
              classNames={{ wrapper: 'mt-0' }}
              value={bet}
              onChange={(value) => $$dicePage.fields.bet.update(String(value))}
              allowedDecimalSeparators={[',', '.']}
              error={errors.bet[0]}
              disabled={autoplaying}
              min={1}
              decimalScale={2}
            />
          </WithError>
          <ActionIcon
            className="text-sm text-[var(--input-color)] disabled:bg-[color:var(--mantine-color-input-bg)] disabled:opacity-60"
            size={36}
            color="var(--mantine-color-input-bg)"
            onClick={() => $$dicePage.betDoubled()}
            disabled={autoplaying}
          >
            x2
          </ActionIcon>
          <ActionIcon
            className="text-sm text-[var(--input-color)] disabled:bg-[color:var(--mantine-color-input-bg)] disabled:opacity-60"
            size={36}
            color="var(--mantine-color-input-bg)"
            onClick={() => $$dicePage.betHalved()}
            disabled={autoplaying}
          >
            /2
          </ActionIcon>
        </div>
      </div>
    </div>
  )
}
