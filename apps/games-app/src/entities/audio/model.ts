import { createEffect, createEvent, sample } from 'effector'

export enum Sound {
  TopUp = 'top_up',
  Withdraw = 'withdraw',
}

/**
 * Preload all sounds
 */
for (const sound of Object.values(Sound)) {
  const audio = new Audio(`/sounds/${sound}.mp3`)
  audio.load()
}

const play = createEvent<Sound>()

const playFx = createEffect((options: { sound: Sound; volume?: number }) => {
  const audio = new Audio(`/sounds/${options.sound}.mp3`)
  audio.volume = options.volume ?? 0.5
  return audio.play()
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
