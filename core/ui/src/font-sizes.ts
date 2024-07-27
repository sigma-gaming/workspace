function fontSize<T extends string>(name: T, size: number, lineHeight: number) {
  return { name, size, lineHeight }
}

export const fontSizes = [
  fontSize('xs', 12, 16),
  fontSize('sm', 14, 20),
  fontSize('base', 16, 24),
  fontSize('lg', 18, 28),
  fontSize('xl', 20, 28),
  fontSize('2xl', 24, 32),
  fontSize('3xl', 30, 36),
  fontSize('4xl', 34, 40),
]
