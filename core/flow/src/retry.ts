type Result<T> =
  | {
      succeeded: true
      output: T
    }
  | {
      succeeded: false
      error: unknown
    }

export async function retry<T>(options: {
  fn: () => Promise<T>
  maxAttempts?: number
  delay?: number
}): Promise<Result<T>> {
  const { fn, maxAttempts = 5, delay = 1000 } = options
  let lastError: unknown = null

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const output = await fn()
      return { succeeded: true, output }
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return { succeeded: false, error: lastError }
}
