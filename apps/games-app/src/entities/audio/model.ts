import { createEffect, createEvent, createStore, sample } from 'effector'
import { persist } from 'effector-storage/local'
import { Howl } from 'howler'
import { debounce } from 'patronum'

export enum Sound {
  TopUp = 'top_up',
  Withdraw = 'withdraw',
  Pincode = 'pincode',
  WinDefault = 'win_default',
  WinBigDefault = 'win_big_default',
  Dice = 'dice',
}

const volumeMultiplierMap: Partial<Record<Sound, number>> = {
  [Sound.Pincode]: 0.75,
  [Sound.TopUp]: 0.3,
}

function getVolumeMultiplier(sound: Sound) {
  return volumeMultiplierMap[sound] ?? 0.5
}

const howlMap = Object.values(Sound).reduce(
  (acc, sound) => {
    acc[sound] = new Howl({
      src: [`/sounds/${sound}.mp3`],
      volume: volumeMultiplierMap[sound] ?? 0.5,
    })

    return acc
  },
  {} as Record<Sound, Howl>,
)

const play = createEvent<Sound>()
const changeVolume = createEvent<number>()

const playFx = createEffect((options: { sound: Sound; volume?: number }) => {
  const howl = howlMap[options.sound]
  howl.play()
})

const $volume = createStore(100).on(changeVolume, (_, volume) => volume)
persist({ store: $volume, key: 'audio/volume' })

sample({
  source: play,
  fn: (sound) => ({ sound }),
  target: playFx,
})

sample({
  source: debounce($volume, 500),
  target: createEffect((volume: number) => {
    Object.values(Sound).forEach((sound) => {
      howlMap[sound].volume((volume / 100) * getVolumeMultiplier(sound))
    })
  }),
})

export const $$audio = {
  play,
  playFx,
  changeVolume,
  $volume,
}
