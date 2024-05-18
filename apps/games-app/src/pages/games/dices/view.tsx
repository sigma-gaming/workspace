import {
  Button,
  Card,
  InputError,
  InputLabel,
  NumberInput,
  Title,
} from '@mantine/core'
import { useRive } from '@rive-app/react-canvas'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { memo, useEffect } from 'react'
import { $$dicesPage } from './model.ts'

const AnimatedDice = memo(() => {
  const { rive, RiveComponent } = useRive({
    src: '/games/dices.riv',
    autoplay: false,
  })

  useEffect(() => {
    $$dicesPage.riveChanged(rive)
  }, [rive])

  return (
    <div className="w-full h-64">
      <RiveComponent />
    </div>
  )
})

export const DicesGamePageView = () => {
  const bet = useUnit($$dicesPage.fields.bet.$value)
  const errors = useUnit($$dicesPage.form.$errors)
  const playing = useUnit($$dicesPage.$playing)
  const autoplaying = useUnit($$dicesPage.$autoplaying)

  return (
    <Card
      component="form"
      className="p-4 rounded-xl md:p-6 md:rounded-2xl"
      style={{ gap: 'var(--mantine-spacing-md)' }}
      onSubmit={(event) => {
        event.preventDefault()
        $$dicesPage.playPressed()
      }}
    >
      <Title order={3}>Dices</Title>

      <AnimatedDice />

      <NumberInput
        label="Ставка"
        value={bet}
        onChange={(value) => $$dicesPage.fields.bet.update(Number(value))}
        error={errors.bet[0]}
        disabled={autoplaying}
        min={1}
        decimalScale={2}
      />

      <InputLabel>Грани</InputLabel>
      <SidesSelect />
      {errors.sides[0] && <InputError>{errors.sides[0]}</InputError>}

      <Button type="submit" disabled={playing || autoplaying} fullWidth={true}>
        Играть
      </Button>
      <Button onClick={() => $$dicesPage.autoplayPressed()} fullWidth={true}>
        {autoplaying ? 'Остановить' : 'Автоигра'}
      </Button>
    </Card>
  )
}

const SidesSelect = () => {
  const sides = useUnit($$dicesPage.fields.sides.$value)
  const update = useUnit($$dicesPage.fields.sides.update)
  const autoplaying = useUnit($$dicesPage.$autoplaying)

  const options = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
  ]

  return (
    <ul className="grid grid-cols-3 grid-flow-row gap-4">
      {options.map(({ value }) => (
        <li key={value} className="block">
          <button
            type="button"
            className="w-full outline-none"
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
            />
          </button>
        </li>
      ))}
    </ul>
  )
}

interface DiceProps {
  className?: string
  side: number
}

const Dice = ({ className, side }: DiceProps) => {
  return (
    <div
      className={clsx(
        className,
        'relative flex justify-center items-center w-full aspect-square bg-white rounded-[16%]',
      )}
    >
      {side === 1 && (
        <DiceDot className="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
      )}

      {side === 2 && (
        <>
          <DiceDot className="top-[30%] left-[30%]" />
          <DiceDot className="bottom-[30%] right-[30%]" />
        </>
      )}

      {side === 3 && (
        <>
          <DiceDot className="top-[22%] left-[22%]" />
          <DiceDot className="right-[22%] bottom-[22%]" />
          <DiceDot className="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
        </>
      )}

      {side === 4 && (
        <>
          <DiceDot className="top-[24%] left-[24%]" />
          <DiceDot className="top-[24%] right-[24%]" />
          <DiceDot className="bottom-[24%] left-[24%]" />
          <DiceDot className="bottom-[24%] right-[24%]" />
        </>
      )}

      {side === 5 && (
        <>
          <DiceDot className="top-[22%] left-[22%]" />
          <DiceDot className="top-[22%] right-[22%]" />
          <DiceDot className="bottom-[22%] left-[22%]" />
          <DiceDot className="bottom-[22%] right-[22%]" />
          <DiceDot className="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
        </>
      )}

      {side === 6 && (
        <>
          <DiceDot className="top-[18%] left-[24%]" />
          <DiceDot className="top-[18%] right-[24%]" />
          <DiceDot className="bottom-[18%] left-[24%]" />
          <DiceDot className="bottom-[18%] right-[24%]" />
          <DiceDot className="top-[50%] left-[24%] -translate-y-1/2" />
          <DiceDot className="top-[50%] right-[24%] -translate-y-1/2" />
        </>
      )}
    </div>
  )
}

interface DiceDotProps {
  className?: string
}

const DiceDot = ({ className }: DiceDotProps) => {
  return (
    <span
      className={clsx(
        className,
        'absolute block min-w-3 min-h-3 w-[16%] h-[16%] rounded-full bg-[#1B1C2F]',
      )}
    />
  )
}
