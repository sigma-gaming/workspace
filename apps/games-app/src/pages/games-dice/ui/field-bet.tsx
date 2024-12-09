import { GemInput, WithError } from '@core/ui'
import { ActionIcon, Input } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$dicePage, MAX_BET, MIN_BET } from '../model'

export const BetField = () => {
  const bet = useUnit($$dicePage.fields.bet.$value)
  const errors = useUnit($$dicePage.form.$errors)
  const autoplaying = useUnit($$dicePage.$autoplaying)

  return (
    <div className="flex flex-col gap-2">
      <Input.Label htmlFor="bet-field">Ставка</Input.Label>
      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-start">
          <WithError error={errors.bet[0]}>
            <GemInput
              id="bet-field"
              className="grow"
              classNames={{ wrapper: 'mt-0' }}
              value={bet}
              min={MIN_BET}
              max={MAX_BET}
              onChange={(value) => $$dicePage.fields.bet.update(value)}
              error={errors.bet[0]}
              disabled={autoplaying}
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
