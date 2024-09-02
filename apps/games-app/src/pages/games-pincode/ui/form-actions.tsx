import { Button, Checkbox } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$user } from '../../../entities/user'
import { $$pincodePage } from '../model'

export const FormActions = () => {
  const playing = useUnit($$pincodePage.$playing)
  const autoplaying = useUnit($$pincodePage.$autoplaying)
  const animationPlaying = useUnit($$pincodePage.$animationPlaying)
  const stopOnBigWin = useUnit($$pincodePage.fields.stopOnBigWin.$value)
  const loggedIn = useUnit($$user.$loggedIn)

  return (
    <div className="flex flex-col gap-3 mt-auto">
      <Button
        type="submit"
        disabled={autoplaying || animationPlaying || !loggedIn}
        loading={playing}
        fullWidth={true}
      >
        Играть
      </Button>
      <Button
        onClick={() => $$pincodePage.autoplayPressed()}
        fullWidth={true}
        disabled={!loggedIn}
      >
        {autoplaying ? 'Остановить автоигру' : 'Автоигра'}
      </Button>
      <div className="flex justify-center px-4">
        <Checkbox
          label="Остановить автоигру при крупном выигрыше"
          checked={stopOnBigWin}
          onChange={(event) =>
            $$pincodePage.fields.stopOnBigWin.update(event.target.checked)
          }
        />
      </div>
    </div>
  )
}
