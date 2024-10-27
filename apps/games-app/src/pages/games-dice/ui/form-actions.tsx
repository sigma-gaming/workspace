import { Button } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$session } from '../../../entities/session'
import { $$dicePage } from '../model'

export const FormActions = () => {
  const playing = useUnit($$dicePage.$playing)
  const autoplaying = useUnit($$dicePage.$autoplaying)
  const animationPlaying = useUnit($$dicePage.$animationPlaying)
  const loading = useUnit($$dicePage.$animationLoading)
  const loggedIn = useUnit($$session.$loggedIn)

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="submit"
        disabled={loading || autoplaying || animationPlaying || !loggedIn}
        loading={playing}
        fullWidth={true}
      >
        Играть
      </Button>
      <Button
        onClick={() => $$dicePage.autoplayPressed()}
        fullWidth={true}
        disabled={loading || !loggedIn}
      >
        {autoplaying ? 'Остановить автоигру' : 'Автоигра'}
      </Button>
    </div>
  )
}
