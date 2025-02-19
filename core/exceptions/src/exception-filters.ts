import { HttpException } from './exceptions'

type Factory<E extends HttpException<any>> = new (...params: any[]) => E

export function isException<E extends HttpException<any>>(
  value: unknown,
  factory: Factory<E>,
): value is E {
  return value instanceof factory
}

export function exceptionFilter<E extends HttpException<any>>(
  factory: Factory<E>,
) {
  return (value: unknown): value is E => isException(value, factory)
}

export function notExceptionFilter(
  factory: Factory<HttpException<any>> | Factory<HttpException<any>>[],
) {
  const factories = Array.isArray(factory) ? factory : [factory]

  return (value: unknown): boolean =>
    factories.every((factory) => !isException(value, factory))
}
