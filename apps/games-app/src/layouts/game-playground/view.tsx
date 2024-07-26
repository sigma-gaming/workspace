import { LoadingOverlay, Title } from '@mantine/core'
import { createContext, memo, ReactNode, useContext } from 'react'

type Props = {
  title: string
  onSubmit: () => void
  animation: ReactNode
  fields: ReactNode
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
  ({ title, loading = false, animation, fields, onSubmit }: Props) => {
    return (
      <GamePlaygroundContext.Provider value={{ loading }}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <Title className="mb-4" order={3}>
            {title}
          </Title>

          <div className="flex flex-col xl:flex-row-reverse gap-4">
            <div className="relative grow flex flex-col items-center justify-center xl:max-w-[calc(100%-256px)] overflow-hidden rounded-lg">
              <Loader />
              {animation}
            </div>

            <div className="flex flex-col gap-4 xl:w-[240px] xl:shrink-0">
              {fields}
            </div>
          </div>
        </form>
      </GamePlaygroundContext.Provider>
    )
  },
)
