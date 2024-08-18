import {
  combine,
  createEffect,
  createEvent,
  createStore,
  Event,
  EventCallable,
  sample,
  Store,
} from 'effector'
import { persist } from 'effector-storage/local'
import { ZodError, ZodObjectDef, ZodSchema } from 'zod'

type FormValues = Record<string, unknown>

export function normalizeFieldErrors<TValues extends FormValues>(
  errors: Record<string, string[] | undefined>,
) {
  const normalized: Partial<Record<keyof TValues, string[]>> = {}
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue
    normalized[key as keyof TValues] = value
  }
  return normalized
}

type FieldOptions<TValue> = {
  emptyValue: TValue
  persistKey?: string
  resetToPersisted?: boolean
}

type Field<TValue> = {
  emptyValue: TValue
  initialize: EventCallable<TValue>
  update: EventCallable<TValue>
  reset: EventCallable<void>
  empty: EventCallable<void>
  setErrors: EventCallable<string[]>
  resetErrors: EventCallable<void>
  $initialValue: Store<TValue>
  $value: Store<TValue>
  $dirty: Store<boolean>
  $empty: Store<boolean>
  $errors: Store<string[]>
  $hasErrors: Store<boolean>
}

type CleanValues<
  TValues extends FormValues,
  TCleanEmpty extends { [K in keyof TValues]?: boolean },
> = {
  [K in keyof TValues]: TCleanEmpty[K] extends true
    ? TValues[K] | undefined
    : TValues[K]
}

type Form<
  TValues extends FormValues,
  TCleanEmpty extends { [K in keyof TValues]?: boolean },
  TValidated,
> = {
  initialize: EventCallable<Partial<TValues>>
  update: EventCallable<Partial<TValues>>
  submit: EventCallable<void>
  submitted: Event<TValidated>
  failed: Event<void>
  updateErrors: EventCallable<Partial<FormErrors<TValues>>>
  setErrors: EventCallable<Partial<FormErrors<TValues>>>
  reset: EventCallable<void>
  empty: EventCallable<void>
  $values: Store<TValues>
  $cleanValues: Store<CleanValues<TValues, TCleanEmpty>>
  $dirty: Store<Record<keyof TValues, boolean>>
  $empty: Store<Record<keyof TValues, boolean>>
  $errors: Store<FormErrors<TValues>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferFormValues<TForm> =
  TForm extends Form<infer TValues, any, any> ? TValues : never

export type FormErrors<TValues extends FormValues> = Record<
  keyof TValues,
  string[]
>

export function createField<TValue>(
  options: FieldOptions<TValue>,
): Field<TValue> {
  const { emptyValue } = options

  const initialize = createEvent<TValue>()
  const update = createEvent<TValue>()

  const reset = createEvent()
  const empty = createEvent()

  const setErrors = createEvent<string[]>()
  const resetErrors = createEvent()

  let initialValue: TValue = emptyValue

  if (options.persistKey) {
    const savedValue = localStorage.getItem(options.persistKey)
    if (savedValue !== null) initialValue = JSON.parse(savedValue)
  }

  const $initialValue = createStore<TValue>(initialValue).on(
    initialize,
    (_, value) => value,
  )

  const $value = createStore<TValue>(emptyValue)
    .on(initialize, (_, value) => value)
    .on(update, (_, value) => value)
    .reset(empty)

  if (options.persistKey) {
    persist({ store: $value, key: options.persistKey })

    if (options.resetToPersisted) {
      sample({
        source: $value,
        target: $initialValue,
      })
    }
  }

  const $empty = $value.map((value) => value === emptyValue)

  const $dirty = combine(
    $initialValue,
    $value,
    (initialValue, value) => initialValue !== value,
  )

  const $errors = createStore<string[]>([])
    .on(setErrors, (_, errors) => errors)
    .reset($value.updates)
    .reset(resetErrors)

  const $hasErrors = $errors.map((errors) => errors.length > 0)

  sample({
    clock: reset,
    source: $initialValue,
    target: $value,
  })

  sample({
    clock: reset,
    target: resetErrors,
  })

  return {
    emptyValue,
    initialize,
    update,
    reset,
    empty,
    setErrors,
    resetErrors,
    $initialValue,
    $value,
    $dirty,
    $empty,
    $errors,
    $hasErrors,
  }
}

export function createForm<
  TValues extends FormValues,
  TCleanEmpty extends { [K in keyof TValues]?: boolean },
  TDirty,
  TValidated,
>(options: {
  fields: { [K in keyof TValues]: Field<TValues[K]> }
  cleanEmpty?: TCleanEmpty
  schema: ZodSchema<TValidated, ZodObjectDef, TDirty>
}): Form<TValues, TCleanEmpty, TValidated> {
  const { fields, cleanEmpty, schema } = options

  type ValidResult = {
    valid: true
    values: TValidated
  }

  type InvalidResult = {
    valid: false
    errors: Partial<Record<keyof TValues, string[]>>
  }

  type ValidationResult = ValidResult | InvalidResult

  const validateFx = createEffect(
    async (
      values: CleanValues<TValues, TCleanEmpty>,
    ): Promise<ValidationResult> => {
      try {
        const validated = await schema.parseAsync(values)
        return { valid: true, values: validated }
      } catch (error) {
        const isZodError = error instanceof ZodError
        if (!isZodError) throw new Error('Unexpected error')
        const errors = normalizeFieldErrors<TValues>(
          error.formErrors.fieldErrors,
        )
        return { valid: false, errors }
      }
    },
  )

  type InitializePayload = Partial<TValues>
  const initialize = createEvent<InitializePayload>()

  type UpdatePayload = Partial<TValues>
  const update = createEvent<UpdatePayload>()

  type SetErrorsPayload = Partial<FormErrors<TValues>>
  const setErrors = createEvent<SetErrorsPayload>()

  type UpdateErrorsPayload = Partial<FormErrors<TValues>>
  const updateErrors = createEvent<UpdateErrorsPayload>()

  const resetErrors = createEvent()

  const submit = createEvent()
  const submitted = createEvent<TValidated>()
  const failed = createEvent()

  const reset = createEvent()
  const empty = createEvent()

  type Reshape<TPath extends keyof Field<unknown>> = {
    [K in keyof TValues]: Field<TValues[K]>[TPath]
  }

  function reshapeFields<TPath extends keyof Field<unknown>>(
    path: TPath,
  ): Reshape<TPath> {
    const result = {} as Reshape<TPath>

    for (const key in fields) {
      const field = fields[key]
      result[key] = field[path]
    }

    return result
  }

  const $values = combine(reshapeFields('$value')) as Store<TValues>

  const $errors = combine(reshapeFields('$errors')) as Store<
    FormErrors<TValues>
  >

  const $cleanValues = combine($values, (values) => {
    const clean = {} as CleanValues<TValues, TCleanEmpty>

    let key: keyof TValues
    for (key in values) {
      const value = values[key]
      const field = fields[key]
      if (cleanEmpty?.[key] && value === field.emptyValue) continue
      clean[key] = values[key] as TValues[keyof TValues]
    }

    return clean
  })

  type ValueFlags = Record<keyof TValues, boolean>
  const $dirty = combine(reshapeFields('$dirty')) as Store<ValueFlags>
  const $empty = combine(reshapeFields('$empty')) as Store<ValueFlags>

  sample({
    source: initialize,
    target: createEffect((initialValues: InitializePayload) => {
      let key: keyof TValues
      for (key in initialValues) {
        const field = fields[key]
        const value = initialValues[key]!
        field.initialize(value)
      }
    }),
  })

  sample({
    source: update,
    target: createEffect((updates: UpdatePayload) => {
      let key: keyof TValues
      for (key in updates) {
        const field = fields[key]
        const value = updates[key]!
        field.update(value)
      }
    }),
  })

  sample({
    source: setErrors,
    target: createEffect((errors: SetErrorsPayload) => {
      let key: keyof TValues
      for (key in fields) {
        const field = fields[key]
        const value = errors[key]
        if (value) field.setErrors(value)
        else field.resetErrors()
      }
    }),
  })

  sample({
    source: updateErrors,
    target: createEffect((errors: SetErrorsPayload) => {
      let key: keyof TValues
      for (key in errors) {
        const field = fields[key]
        const value = errors[key]!
        field.setErrors(value)
      }
    }),
  })

  sample({
    clock: resetErrors,
    target: Object.values(fields).map((field) => field.resetErrors),
  })

  sample({
    clock: submit,
    target: resetErrors,
  })

  sample({
    clock: submit,
    source: $cleanValues,
    target: validateFx,
  })

  sample({
    source: validateFx.doneData,
    filter: (result: ValidationResult): result is ValidResult => result.valid,
    fn: (result) => result.values,
    target: submitted,
  })

  sample({
    source: validateFx.doneData,
    filter: (result: ValidationResult): result is InvalidResult =>
      !result.valid,
    fn: (result) => result.errors,
    target: [setErrors, failed],
  })

  sample({
    clock: reset,
    target: Object.values(fields).map((field) => field.reset),
  })

  sample({
    clock: empty,
    target: Object.values(fields).map((field) => field.empty),
  })

  return {
    initialize,
    update,
    submit,
    submitted: submitted as Event<TValidated>,
    failed,
    updateErrors,
    setErrors,
    reset,
    empty,
    $values,
    $cleanValues,
    $dirty,
    $empty,
    $errors,
  }
}
