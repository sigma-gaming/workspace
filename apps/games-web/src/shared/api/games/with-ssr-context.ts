import { ProcedureOptions } from '@trpc/server'
import { createFactory } from '@withease/factories'
import { attach, Effect } from 'effector'
import { $$SSRContext } from '../ssr-context.ts'

type Procedure<T, O> = (input: T, options: ProcedureOptions) => O | Promise<O>

export const withSSRContext = createFactory(
  <T, O>(procedure: Procedure<T, O>): Effect<T, O> => {
    return attach({
      source: $$SSRContext.$cookies,
      async effect(cookies, input: T) {
        return procedure(input, {
          context: { cookies },
        })
      },
    })
  },
)
