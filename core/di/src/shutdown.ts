const registry = new Set<Shutdownable>()

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Shutdownable {
  shutdownBefore?: Array<new () => Shutdownable>
}

export abstract class Shutdownable {
  constructor() {
    registry.add(this)
  }

  abstract shutdown(): Promise<void>
}

export async function shutdownAll(timeout = 2500) {
  const sorted = topologicalSort(Array.from(registry))

  const performShutdown = async () => {
    for (const group of sorted) {
      await Promise.all(
        group.map((service) =>
          service.shutdown().catch(() => {
            console.info('Failed to shutdown service')
          }),
        ),
      )
    }
  }

  const shutdownPromise = performShutdown()

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Shutdown timeout')), timeout)
  })

  return Promise.race([shutdownPromise, timeoutPromise])
}

function topologicalSort(services: Shutdownable[]): Shutdownable[][] {
  const dependencyGraph = new Map<Shutdownable, Shutdownable[]>()
  const inDegree = new Map<Shutdownable, number>()

  for (const service of services) {
    dependencyGraph.set(service, [])
    inDegree.set(service, 0)
  }

  for (const service of services) {
    for (const dependency of service.shutdownBefore || []) {
      const dependencyInstances = services.filter(
        (service) => service instanceof dependency,
      )

      for (const dependencyInstance of dependencyInstances) {
        dependencyGraph.get(service)?.push(dependencyInstance)
        const current = inDegree.get(dependencyInstance) || 0
        inDegree.set(dependencyInstance, current + 1)
      }
    }
  }

  const queue: Shutdownable[] = []
  let index = 0

  for (const [service, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(service)
  }

  const sortedOrder: Shutdownable[] = []

  while (index < queue.length) {
    const service = queue[index++]
    sortedOrder.push(service)

    for (const dependentService of dependencyGraph.get(service) || []) {
      inDegree.set(dependentService, inDegree.get(dependentService)! - 1)
      if (inDegree.get(dependentService) === 0) queue.push(dependentService)
    }
  }

  if (sortedOrder.length !== services.length) {
    throw new Error('Shutdown graph contains a cycle!')
  }

  const groupedByClass: Shutdownable[][] = []
  const classMap = new Map<typeof Shutdownable, Shutdownable[]>()

  for (const service of sortedOrder) {
    const serviceClass = service.constructor as typeof Shutdownable

    if (!classMap.has(serviceClass)) {
      classMap.set(serviceClass, [])
    }

    classMap.get(serviceClass)?.push(service)
  }

  for (const group of classMap.values()) {
    groupedByClass.push(group)
  }

  return groupedByClass
}
