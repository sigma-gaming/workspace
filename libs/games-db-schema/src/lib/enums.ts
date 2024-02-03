export function enumValues<T extends string>(value: Record<string, T>) {
  return Object.values(value) as [T, ...T[]]
}
