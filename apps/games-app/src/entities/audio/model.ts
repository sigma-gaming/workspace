import { createEffect, createEvent, sample } from 'effector'
import { Howl } from 'howler'

export enum Sound {
  TopUp = 'top_up',
  Withdraw = 'withdraw',
  Pincode = 'pincode',
  WinDefault = 'win_default',
  WinBigDefault = 'win_big_default',
  Dice = 'dice',
}

const defaultVolumeMap: Partial<Record<Sound, number>> = {}

const howlMap = Object.values(Sound).reduce(
  (acc, sound) => {
    acc[sound] = new Howl({
      src: [`/sounds/${sound}.mp3`],
      volume: defaultVolumeMap[sound] ?? 0.5,
    })

    return acc
  },
  {} as Record<Sound, Howl>,
)

const play = createEvent<Sound>()

const playFx = createEffect((options: { sound: Sound; volume?: number }) => {
  const howl = howlMap[options.sound]
  howl.play()
})

sample({
  source: play,
  fn: (sound) => ({ sound }),
  target: playFx,
})

export const $$audio = {
  play,
  playFx,
}
