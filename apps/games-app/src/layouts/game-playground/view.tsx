import { useMedia } from '@core/ui'
import { Button, Collapse, LoadingOverlay } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconEye, IconEyeClosed } from '@tabler/icons-react'
import { createContext, memo, ReactNode, useContext, useEffect } from 'react'

type Props = {
  title: string
  onSubmit: () => void
  animationZone: ReactNode
  fieldsZone: ReactNode
  actionsZone: ReactNode
  controlsZone?: ReactNode
  loading?: boolean
}

type GamePlaygroundContext = {
  loading: boolean
}

const GamePlaygroundContext = createContext<GamePlaygroundContext>({
  loading: false,
})

const Loader = () => {
  const { loading } = useContext(GamePlaygroundContext)

  return (
    <LoadingOverlay
      className="h-full"
      visible={loading}
      loaderProps={{ size: 'xl' }}
    />
  )
}

/**
 * Used inside GameLayout to create Form + Animation layout
 */
export const GamePlaygroundLayout = memo(
  ({
    title,
    loading = false,
    animationZone,
    fieldsZone,
    actionsZone,
    controlsZone,
    onSubmit,
  }: Props) => {
    return (
      <GamePlaygroundContext.Provider value={{ loading }}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <div className="mb-6 flex gap-4 items-center justify-between">
            <h2 className="font-text text-2xl font-bold leading-none">
              {title}
            </h2>

            {controlsZone && <div className="flex gap-4">{controlsZone}</div>}
          </div>

          <div className="flex flex-col xl:flex-row-reverse gap-4">
            <div className="relative grow w-full flex flex-col items-center justify-center shrink-0 xl:max-w-[calc(100%-256px)] overflow-hidden rounded-lg">
              <Loader />
              {animationZone}
            </div>

            <FormZone fieldsZone={fieldsZone} actionsZone={actionsZone} />
          </div>
        </form>
      </GamePlaygroundContext.Provider>
    )
  },
)

const FormZone = ({
  fieldsZone,
  actionsZone,
}: Pick<Props, 'fieldsZone' | 'actionsZone'>) => {
  const [formOpened, { toggle: toggleForm, open: openForm }] =
    useDisclosure(true)

  const isTabletPlus = useMedia({ from: 'sm' })

  useEffect(() => {
    if (!formOpened && isTabletPlus) {
      openForm()
    }
  }, [formOpened, isTabletPlus, openForm])

  return (
    <div className="flex flex-col gap-4 xl:w-[240px] xl:shrink-0">
      <Collapse in={formOpened}>
        <div className="flex flex-col gap-4 w-full">{fieldsZone}</div>
      </Collapse>

      <div className="flex flex-col gap-4 w-full mt-auto">{actionsZone}</div>

      <Button
        className="sm:hidden"
        color="violet"
        onClick={toggleForm}
        leftSection={
          formOpened ? <IconEyeClosed size={20} /> : <IconEye size={20} />
        }
      >
        {formOpened ? 'Скрыть форму' : 'Показать форму'}
      </Button>
    </div>
  )
}
