import { ValidationException } from '@core/exceptions'
import type { Static, TObject } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import type { ValueError, ValueErrorIterator } from '@sinclair/typebox/value'
import { Value } from '@sinclair/typebox/value'
import type { Env, MiddlewareHandler, ValidationTargets } from 'hono'
import { validator } from 'hono/validator'

export enum TypeboxError {
  ArrayContains = 0,
  ArrayMaxContains = 1,
  ArrayMaxItems = 2,
  ArrayMinContains = 3,
  ArrayMinItems = 4,
  ArrayUniqueItems = 5,
  Array = 6,
  AsyncIterator = 7,
  BigIntExclusiveMaximum = 8,
  BigIntExclusiveMinimum = 9,
  BigIntMaximum = 10,
  BigIntMinimum = 11,
  BigIntMultipleOf = 12,
  BigInt = 13,
  Boolean = 14,
  DateExclusiveMaximumTimestamp = 15,
  DateExclusiveMinimumTimestamp = 16,
  DateMaximumTimestamp = 17,
  DateMinimumTimestamp = 18,
  DateMultipleOfTimestamp = 19,
  Date = 20,
  Function = 21,
  IntegerExclusiveMaximum = 22,
  IntegerExclusiveMinimum = 23,
  IntegerMaximum = 24,
  IntegerMinimum = 25,
  IntegerMultipleOf = 26,
  Integer = 27,
  IntersectUnevaluatedProperties = 28,
  Intersect = 29,
  Iterator = 30,
  Kind = 31,
  Literal = 32,
  Never = 33,
  Not = 34,
  Null = 35,
  NumberExclusiveMaximum = 36,
  NumberExclusiveMinimum = 37,
  NumberMaximum = 38,
  NumberMinimum = 39,
  NumberMultipleOf = 40,
  Number = 41,
  ObjectAdditionalProperties = 42,
  ObjectMaxProperties = 43,
  ObjectMinProperties = 44,
  ObjectRequiredProperty = 45,
  Object = 46,
  Promise = 47,
  RegExp = 48,
  StringFormatUnknown = 49,
  StringFormat = 50,
  StringMaxLength = 51,
  StringMinLength = 52,
  StringPattern = 53,
  String = 54,
  Symbol = 55,
  TupleLength = 56,
  Tuple = 57,
  Uint8ArrayMaxByteLength = 58,
  Uint8ArrayMinByteLength = 59,
  Uint8Array = 60,
  Undefined = 61,
  Union = 62,
  Void = 63,
}

export function tbValidator<
  T extends TObject,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  V extends {
    in: { [K in Target]: Static<T> }
    out: { [K in Target]: Static<T> }
  },
>(
  target: Target,
  schema: T,
  errorMessages?: T extends TObject<infer O>
    ? Partial<Record<keyof O, Partial<Record<TypeboxError, string>>>>
    : never,
  compile = true,
): MiddlewareHandler<E, P, V> {
  const compiled = compile ? TypeCompiler.Compile(schema) : null

  const check = (value: unknown): value is Static<T> => {
    if (compile) return compiled!.Check(value)
    return Value.Check(schema, value)
  }

  const getErrors = (value: unknown): ValueError[] => {
    let iterator: ValueErrorIterator
    if (compile) iterator = compiled!.Errors(value)
    else iterator = Value.Errors(schema, value)
    return Array.from(iterator)
  }

  // @ts-expect-error not typed well
  return validator(target, (data) => {
    if (check(data)) {
      return data
    }

    const errors = getErrors(data)

    throw new ValidationException({
      fieldErrors: errors.reduce(
        (acc, error) => {
          const key = error.path.slice(1)
          const fieldErrors = errorMessages?.[key]
          acc[key] = [fieldErrors?.[error.type] ?? error.message]
          return acc
        },
        {} as Record<string, string[] | undefined>,
      ),
    })
  })
}
