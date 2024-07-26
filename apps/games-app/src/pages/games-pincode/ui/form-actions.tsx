import { Button } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$pincodePage } from '../model'

export const FormActions = () => {
  const playing = useUnit($$pincodePage.$playing)
  const autoplaying = useUnit($$pincodePage.$autoplaying)
  const animationPlaying = useUnit($$pincodePage.$animationPlaying)

  return (
    <div className="flex flex-col gap-3 mt-auto">
      <Button
        type="submit"
        disabled={autoplaying || animationPlaying}
        loading={playing}
        fullWidth={true}
      >
        Играть
      </Button>
      <Button onClick={() => $$pincodePage.autoplayPressed()} fullWidth={true}>
        {autoplaying ? 'Остановить автоигру' : 'Автоигра'}
      </Button>
    </div>
  )
}
