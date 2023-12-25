import { $$effectify } from '@effectify/core/client'
import { ProcedureOptions } from '@trpc/server'
import { createFactory } from '@withease/factories'
import { attach, Effect } from 'effector'

type Procedure<T, O> = (input: T, options: ProcedureOptions) => O | Promise<O>

export const createTRPCEffect = createFactory(
  <T, O>(procedure: Procedure<T, O>): Effect<T, O> => {
    return attach({
      source: $$effectify.$context,
      async effect({ req }, input: T) {
        return procedure(input, {
          context: { cookies: req?.headers.cookie ?? 'test' },
        })
      },
    })
  },
)
