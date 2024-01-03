import { Mutation } from '@farfetched/core'
import { TRPCClientError } from '@trpc/client'
import { TRPCError } from '@trpc/server'
import {
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
  Store,
  UnitTargetable,
} from 'effector'
import { reset } from 'patronum'
import { ZodError, ZodObjectDef, ZodSchema } from 'zod'

type FormValues = Record<string, unknown>

function normalizeFieldErrors(errors: Record<string, string[] | undefined>) {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue
    normalized[key] = value[0]
  }
  return normalized
}

export function createForm<
  TValues extends FormValues,
  TDirty,
  TValidated,
>(options: {
  values: { [K in keyof TValues]: Store<TValues[K]> }
  schema: ZodSchema<TValidated, ZodObjectDef, TDirty>
  mutation: Mutation<TValidated, any, unknown>
}) {
  interface ValidResult {
    valid: true
    values: TValidated
  }

  interface InvalidResult {
    valid: false
    errors: Record<string, string>
  }

  type ValidationResult = ValidResult | InvalidResult

  const validateFx = createEffect((values: FormValues): ValidationResult => {
    try {
      const validated = options.schema.parse(values)
      return { valid: true, values: validated }
    } catch (error) {
      const isZodError = error instanceof ZodError
      if (!isZodError) throw new Error('Unexpected error')
      console.log(error.formErrors.fieldErrors)
      const errors = normalizeFieldErrors(error.formErrors.fieldErrors)
      return { valid: false, errors }
    }
  })

  const submit = createEvent()

  const $values = combine(options.values, (values) => values)
  const $errors = createStore<Record<string, string>>({})

  sample({
    clock: submit,
    source: $values,
    target: validateFx,
  })

  reset({
    clock: submit,
    target: $errors,
  })

  sample({
    source: validateFx.doneData,
    filter: (result: ValidationResult): result is InvalidResult =>
      !result.valid,
    fn: (result) => result.errors,
    target: $errors,
  })

  sample({
    source: validateFx.doneData,
    filter: (result: ValidationResult): result is ValidResult => result.valid,
    fn: (result) => result.values,
    target: options.mutation.start,
  })

  sample({
    source: options.mutation.finished.failure,
    fn: ({ error }) => {
      if (
        error instanceof TRPCClientError &&
        error.data.error === 'BadRequestException'
      ) {
        const errors: Record<string, string> = {}
        const { path, message } = error.data.payload
        errors[path.join('.')] = message
        return errors
      }

      return {}
    },
    target: $errors,
  })

  return {
    $values,
    $errors,
    submit,
  }
}
