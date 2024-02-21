function screen<T extends string>(name: T, width: number) {
  return { name, width }
}

export const screens = [
  screen('xs', 0),
  screen('sm', 640),
  screen('md', 768),
  screen('lg', 1024),
  screen('xl', 1280),
  screen('2xl', 1536),
]

export type Screen = (typeof screens)[number]
export type Breakpoint = Screen['name']
