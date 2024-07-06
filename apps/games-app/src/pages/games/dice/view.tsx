import {
  ActionIcon,
  Button,
  Card,
  InputError,
  InputLabel,
  LoadingOverlay,
  NumberInput,
  Title,
} from '@mantine/core'
import { useRive } from '@rive-app/react-canvas'
import { IconFlame } from '@tabler/icons-react'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { memo, useEffect } from 'react'
import { $$dicePage } from './model.ts'

const AnimatedDice = memo(() => {
  const loaded = useUnit($$dicePage.$animationLoaded)

  const { rive, RiveComponent } = useRive({
    src: '/games/dice.riv',
    onLoad: () => $$dicePage.animationLoaded(),
    onPlay: () => $$dicePage.animationStarted(),
    onStop: () => $$dicePage.animationFinished(),
  })

  useEffect(() => {
    $$dicePage.riveChanged(rive)
  }, [rive])

  return (
    <div className="w-full">
      <LoadingOverlay
        className="h-full"
        visible={!loaded}
        loaderProps={{ size: 'xl' }}
      />
      <RiveComponent className="h-64" />
    </div>
  )
})

export const DiceGamePageView = () => {
  const bet = useUnit($$dicePage.fields.bet.$value)
  const errors = useUnit($$dicePage.form.$errors)
  const playing = useUnit($$dicePage.$playing)
  const autoplaying = useUnit($$dicePage.$autoplaying)
  const animationPlaying = useUnit($$dicePage.$animationPlaying)
  const possibleWinAmount = useUnit($$dicePage.$possibleWinAmount)

  return (
    <Card
      component="form"
      className="p-4 rounded-xl md:p-6 md:rounded-2xl"
      onSubmit={(event) => {
        event.preventDefault()
        $$dicePage.playPressed()
      }}
    >
      <Title className="mb-4" order={3}>
        Dice
      </Title>

      <div className="flex flex-col xl:flex-row-reverse gap-4">
        <div className="relative grow xl:max-w-[calc(100%-256px)] overflow-hidden rounded-lg">
          <AnimatedDice />
        </div>

        <div className="flex flex-col gap-3 xl:w-[240px] xl:shrink-0">
          <InputLabel>Ставка</InputLabel>
          <div className="flex flex-col">
            <div className="flex flex-row gap-2 items-start">
              <NumberInput
                className="grow"
                classNames={{ wrapper: 'mt-0' }}
                value={bet}
                onChange={(value) =>
                  $$dicePage.fields.bet.update(Number(value))
                }
                error={errors.bet[0]}
                disabled={autoplaying}
                min={1}
                decimalScale={2}
              />
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

          <InputLabel>Грани</InputLabel>
          <SidesSelect />
          {errors.sides[0] && <InputError>{errors.sides[0]}</InputError>}

          {possibleWinAmount > 0 && (
            <div className="flex items-center justify-center gap-0.5">
              <IconFlame className="text-[#FF7A00] w-6 h-6" />
              <p className="font-interface text-sm">
                Возможный выигрыш:{' '}
                <span className="text-green-400 font-[500]">
                  {possibleWinAmount}
                </span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-2">
            <Button
              type="submit"
              disabled={autoplaying || animationPlaying}
              loading={playing}
              fullWidth={true}
            >
              Играть
            </Button>
            <Button
              onClick={() => $$dicePage.autoplayPressed()}
              fullWidth={true}
            >
              {autoplaying ? 'Остановить автоигру' : 'Автоигра'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

const SidesSelect = () => {
  const sides = useUnit($$dicePage.fields.sides.$value)
  const update = useUnit($$dicePage.fields.sides.update)
  const autoplaying = useUnit($$dicePage.$autoplaying)

  const options = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
  ]

  return (
    <ul className="grid grid-cols-3 min-[396px]:grid-cols-4 min-[396px]:max-w-[360px] min-[576px]:grid-cols-6 min-[576px]:max-w-[540px] lg:grid-cols-4 lg:max-w-[360px] xl:grid-cols-3 xl:max-w-none grid-flow-row gap-4">
      {options.map(({ value }) => (
        <li key={value} className="block">
          <button
            type="button"
            className="block w-full outline-none"
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
        'relative flex justify-center items-center w-full aspect-square bg-white rounded-[16%] select-none',
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
        'absolute block min-w-2 min-h-2 w-[16%] h-[16%] rounded-full bg-[#1B1C2F]',
      )}
    />
  )
}
