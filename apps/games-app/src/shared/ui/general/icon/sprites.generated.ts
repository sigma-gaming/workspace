export interface SpritesMap {
  sprite: 'logo-telegram' | 'logo-vk' | 'main-page' | 'pin-code'
}
export const SPRITES_META: {
  [Key in keyof SpritesMap]: {
    filePath: string
    items: Record<
      SpritesMap[Key],
      {
        viewBox: string
        width: number
        height: number
      }
    >
  }
} = {
  sprite: {
    filePath: 'sprite.aefe5ee6.svg',
    items: {
      'logo-telegram': {
        viewBox: '0 0 24 24',
        width: 24,
        height: 24,
      },
      'logo-vk': {
        viewBox: '0 0 24 24',
        width: 24,
        height: 24,
      },
      'main-page': {
        viewBox: '0 0 20 20',
        width: 20,
        height: 20,
      },
      'pin-code': {
        viewBox: '0 0 20 20',
        width: 20,
        height: 20,
      },
    },
  },
}
