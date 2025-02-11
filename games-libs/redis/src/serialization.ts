// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { camelCase, pascalCase } from 'change-case/keys'

export const serializator = {
  parse: <T>(value: string) => {
    const object = JSON.parse(value)
    return camelCase(object, Infinity) as T
  },

  stringify: (value: unknown) => {
    const object = pascalCase(value, Infinity)
    return JSON.stringify(object)
  },
}
