import { RouteException } from './exceptions'

type Factory<E extends RouteException<any>> = new (...params: any[]) => E

export function isException<E extends RouteException<any>>(
  value: unknown,
  factory: Factory<E>,
): value is E {
  return value instanceof factory
}

export function exceptionFilter<E extends RouteException<any>>(
  factory: Factory<E>,
) {
  return (value: unknown): value is E => isException(value, factory)
}

export function notExceptionFilter(
  factory: Factory<RouteException<any>> | Factory<RouteException<any>>[],
) {
  const factories = Array.isArray(factory) ? factory : [factory]

  return (value: unknown): boolean =>
    factories.every((factory) => !isException(value, factory))
}
