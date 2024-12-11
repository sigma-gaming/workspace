/**
 * Takes the first item from an array.
 *
 * @param items - The array to take the first item from.
 * @returns The first item from the array.
 */
export function takeFirst<T>(items: T[]) {
  return items.at(0)
}

/**
 * Takes the first item from an array or returns null if the array is empty.
 *
 * @param items - The array to take the first item from.
 * @returns The first item from the array or null.
 */
export function takeFirstOrNull<T>(items: T[]) {
  return takeFirst(items) ?? null
}

export function takeFirstOrUndefined<T>(items: T[]) {
  return takeFirst(items) ?? undefined
}

export function takeFirstOrThrow<T>(items: T[]) {
  const first = takeFirst(items)
  if (!first) throw new Error('Expected at least one item')
  return first
}

export function assertDefined<T>(
  value: T | undefined,
  message?: string,
): asserts value is T {
  if (value === undefined) {
    throw new Error(message || 'Value should be defined')
  }
}
