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

export async function shutdownAll() {
  const sorted = topologicalSort(Array.from(registry))

  for (const group of sorted) {
    await Promise.all(group.map((service) => service.shutdown()))
  }
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

  for (const [service, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(service)
  }

  const sortedOrder: Shutdownable[] = []

  while (queue.length > 0) {
    const service = queue.shift()!
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
