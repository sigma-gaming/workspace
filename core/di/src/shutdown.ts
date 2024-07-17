import { container, InjectionToken } from 'tsyringe-neo'
import { implementsApplicationShutdown, OnApplicationShutdown } from './hooks'

interface Registry {
  entries(): IterableIterator<[InjectionToken<any>, { instance: unknown }]>
}

/**
 * Call `onApplicationShutdown` on all service instances that implement it
 */
export async function shutdownServices() {
  const registry: Registry = (container as any)._registry
  const stack: OnApplicationShutdown[] = []

  for (const [token] of registry.entries()) {
    const instances = container.resolveAll(token)

    for (const instance of instances) {
      if (implementsApplicationShutdown(instance)) {
        stack.push(instance)
      }
    }
  }

  while (stack.length > 0) {
    const service = stack.pop()!

    const shouldShutdownLater = stack.some((instance) => {
      if (!instance.shutdownBefore) return false

      return instance.shutdownBefore.some((token) => {
        return container
          .resolveAll(token)
          .filter(
            (dependency) =>
              implementsApplicationShutdown(dependency) &&
              stack.includes(dependency),
          )
          .includes(service)
      })
    })

    if (shouldShutdownLater) {
      stack.unshift(service)
      continue
    }

    await service.onApplicationShutdown()
  }
}
