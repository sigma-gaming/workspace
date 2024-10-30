type Options = Record<string, any>

type OptionsToken<T extends Options> = {
  name: string
  __internal__?: T
}

const registry: Map<OptionsToken<Options>, Options> = new Map()

export function createOptionsToken<T extends Options>(
  name: string,
): OptionsToken<T> {
  return { name }
}

export function resolveOptions<T extends Options>(token: OptionsToken<T>): T {
  const options = registry.get(token)

  if (!options) {
    throw new Error(`Options with token ${String(token.name)} not found`)
  }

  return options as T
}

export function registerOptions<T extends Options>(
  token: OptionsToken<T>,
  options: T,
) {
  registry.set(token, options)
}
