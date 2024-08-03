import { InputError, InputLabel } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$dicePage } from '../model'
import { Dice } from './dice'

export const SidesField = () => {
  const sides = useUnit($$dicePage.fields.sides.$value)
  const update = useUnit($$dicePage.fields.sides.update)
  const autoplaying = useUnit($$dicePage.$autoplaying)
  const errors = useUnit($$dicePage.form.$errors)

  const options = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
  ]

  return (
    <div className="flex flex-col gap-2">
      <InputLabel htmlFor="sides-field">Грани</InputLabel>
      <ul
        id="sides-field"
        className="grid grid-cols-3 min-[396px]:grid-cols-4 min-[396px]:max-w-[360px] min-[576px]:grid-cols-6 min-[576px]:max-w-[540px] lg:grid-cols-4 lg:max-w-[360px] xl:grid-cols-3 xl:max-w-none grid-flow-row gap-4"
      >
        {options.map(({ label, value }) => (
          <li key={value} className="block">
            <button
              name={`Грань ${label}`}
              type="button"
              className="block w-full outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() =>
                update(
                  sides.includes(value)
                    ? sides.filter((side) => side !== value)
                    : sides.concat(value),
                )
              }
              disabled={autoplaying}
            >
              <Dice
                className={sides.includes(value) ? 'opacity-100' : 'opacity-25'}
                side={Number(value)}
                error={Boolean(errors.sides[0])}
              />
            </button>
          </li>
        ))}
      </ul>
      {errors.sides[0] && <InputError>{errors.sides[0]}</InputError>}
    </div>
  )
}
