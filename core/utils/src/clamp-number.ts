export function clampNumber(min: number, value: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
