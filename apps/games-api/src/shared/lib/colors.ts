import { env } from '../env'

function createColorFunction(start: string): (text: string) => string {
  if (env.isProd) return (text) => text
  return (text) => `${start}${text}\u001B[0m`
}

export const colors = {
  cyan: createColorFunction('\u001B[36m'),
  green: createColorFunction('\u001B[32m'),
  red: createColorFunction('\u001B[31m'),
  dim: createColorFunction('\u001B[2m'),
}
