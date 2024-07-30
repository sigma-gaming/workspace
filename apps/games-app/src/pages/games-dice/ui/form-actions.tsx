import { Button } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$dicePage } from '../model'

export const FormActions = () => {
  const playing = useUnit($$dicePage.$playing)
  const autoplaying = useUnit($$dicePage.$autoplaying)
  const animationPlaying = useUnit($$dicePage.$animationPlaying)

  return (
    <div className="flex flex-col gap-3 mt-2">
      <Button
        type="submit"
        disabled={autoplaying || animationPlaying}
        loading={playing}
        fullWidth={true}
      >
        Играть
      </Button>
      <Button onClick={() => $$dicePage.autoplayPressed()} fullWidth={true}>
        {autoplaying ? 'Остановить автоигру' : 'Автоигра'}
      </Button>
    </div>
  )
}
