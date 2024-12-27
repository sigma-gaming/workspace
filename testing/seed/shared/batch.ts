export async function batch<T>(
  size: number,
  list: T[],
  fn: (item: T) => Promise<void>,
) {
  let batch: Promise<void>[] = []

  for (const item of list) {
    batch.push(fn(item))

    if (batch.length >= size) {
      await Promise.allSettled(batch)
      batch = []
    }
  }

  if (batch.length > 0) {
    await Promise.all(batch)
  }
}
